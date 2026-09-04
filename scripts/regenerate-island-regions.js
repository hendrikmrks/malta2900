// Nachziehen der Ressourcen-Gebiete fuer bestehende Accounts - exakt nach
// derselben Logik wie app/src/lib/islandGen.ts (hier in Plain-JS dupliziert,
// da dieses Script ohne TS-Compile-Schritt direkt per `node` laeuft - siehe
// worker/index.js fuer dasselbe etablierte Muster bei den XP-Konstanten).
//
// Aufruf: docker compose exec app node scripts/regenerate-island-regions.js
//         (nur Accounts ohne Gebiete, z.B. nach dem ersten Rollout)
//   mit --force: ersetzt auch bereits vorhandene Gebiete (z.B. nach einer
//         Tuning-Aenderung an Groesse/Abstand der Gebiete).
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const FORCE = process.argv.includes("--force");

const REGION_TYPES = ["grove", "forest", "spring", "field", "sea", "quarry"];
const REGION_RADIUS_MIN = 8;
const REGION_RADIUS_MAX = 13;
// Muss mindestens REGION_RADIUS_MAX sein, sonst kann ein Gebiet ueber den
// Kartenrand hinausragen.
const MAP_MARGIN = REGION_RADIUS_MAX + 3;
const MIN_CENTER_DISTANCE = 20;
const PLAYER_START = { x: 50, y: 65 };
const PLAYER_START_CLEARANCE = 22;
const MAX_PLACEMENT_ATTEMPTS = 60;
const REGION_INCLUSION_CHANCE = 0.6;
const MIN_REGIONS = 2;
const COAST_DEPTH_MIN = 5;
const COAST_DEPTH_MAX = 13;

function isValidSpot(x, y, existing) {
  const farFromStart = Math.hypot(x - PLAYER_START.x, y - PLAYER_START.y) >= PLAYER_START_CLEARANCE;
  const farFromOthers = existing.every((r) => Math.hypot(x - r.x, y - r.y) >= MIN_CENTER_DISTANCE);
  return farFromStart && farFromOthers;
}

function randomPosition(existing) {
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const x = MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN);
    const y = MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN);
    if (isValidSpot(x, y, existing)) {
      return { x: Math.round(x), y: Math.round(y) };
    }
  }
  return {
    x: Math.round(MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN)),
    y: Math.round(MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN)),
  };
}

// Nahe einer der vier Kartenkanten statt frei irgendwo - eine "sea"-Kueste
// mitten im Landesinneren wirkt sonst unnatuerlich.
function randomCoastalPosition(existing) {
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const side = Math.floor(Math.random() * 4);
    const depth = COAST_DEPTH_MIN + Math.random() * (COAST_DEPTH_MAX - COAST_DEPTH_MIN);
    const along = MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN);
    let x, y;
    switch (side) {
      case 0:
        x = along;
        y = MAP_MARGIN + depth;
        break;
      case 1:
        x = 100 - MAP_MARGIN - depth;
        y = along;
        break;
      case 2:
        x = along;
        y = 100 - MAP_MARGIN - depth;
        break;
      default:
        x = MAP_MARGIN + depth;
        y = along;
        break;
    }
    if (isValidSpot(x, y, existing)) {
      return { x: Math.round(x), y: Math.round(y) };
    }
  }
  return randomPosition(existing);
}

function generateIslandRegions() {
  const included = REGION_TYPES.filter(() => Math.random() < REGION_INCLUSION_CHANCE);
  if (included.length < MIN_REGIONS) {
    const remaining = REGION_TYPES.filter((t) => !included.includes(t));
    while (included.length < MIN_REGIONS && remaining.length > 0) {
      const i = Math.floor(Math.random() * remaining.length);
      included.push(remaining.splice(i, 1)[0]);
    }
  }

  const regions = [];
  for (const type of included) {
    const pos = type === "sea" ? randomCoastalPosition(regions) : randomPosition(regions);
    const radius = Math.round(
      REGION_RADIUS_MIN + Math.random() * (REGION_RADIUS_MAX - REGION_RADIUS_MIN)
    );
    regions.push({ type, x: pos.x, y: pos.y, radius });
  }
  return regions;
}

async function main() {
  const players = await prisma.playerState.findMany({
    include: { mapRegions: { take: 1 } },
  });

  let updated = 0;
  for (const player of players) {
    if (player.mapRegions.length > 0 && !FORCE) continue;

    if (FORCE) {
      await prisma.mapRegion.deleteMany({ where: { playerId: player.id } });
    }

    const regions = generateIslandRegions();
    await prisma.mapRegion.createMany({
      data: regions.map((r) => ({ ...r, playerId: player.id })),
    });
    updated += 1;
    console.log(`${player.id}: ${regions.map((r) => `${r.type}(r${r.radius})`).join(", ")}`);
  }

  console.log(`Fertig - ${updated} von ${players.length} Insel(n) neu bestueckt.`);
}

main()
  .catch((err) => {
    console.error("Regenerierung fehlgeschlagen:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
