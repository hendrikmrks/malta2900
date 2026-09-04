// Zufaellige Erzeugung der Ressourcen-Gebiete einer neuen Insel - laeuft
// einmalig bei der Registrierung (siehe api/register) und beim einmaligen
// Nachziehen bestehender Accounts (siehe scripts/regenerate-island-regions.js,
// das dieselbe Logik in Plain-JS dupliziert, da es ohne TS-Compile-Schritt
// laeuft).
import { REGION_TYPES, REGION_RADIUS_MIN, REGION_RADIUS_MAX, type RegionType } from "./game";

export type GeneratedRegion = { type: RegionType; x: number; y: number; radius: number };

// Kleiner und ungleichmaessig statt gestanzt-groß, damit rund um den
// Startpunkt genug freie Flaeche fuers eigene Dorf (Lagerfeuer/Unterschlupf)
// bleibt. MAP_MARGIN muss mindestens REGION_RADIUS_MAX sein, sonst kann ein
// Gebiet mit seinem Rand ueber den Kartenrand hinausragen (0..100 %).
const MAP_MARGIN = REGION_RADIUS_MAX + 3;
const MIN_CENTER_DISTANCE = 20;
// Charakter startet bei (50, 65) - siehe PlayerState.posX/posY Default. Dieser
// Bereich bleibt garantiert frei von Gebieten, damit dort Platz zum Bauen ist.
const PLAYER_START = { x: 50, y: 65 };
const PLAYER_START_CLEARANCE = 22;
const MAX_PLACEMENT_ATTEMPTS = 60;
// Unabhaengige Chance je Gebietstyp, auf einer neuen Insel vorhanden zu sein -
// im Schnitt hat eine Insel damit gut die Haelfte der sechs Gebiete, manche
// fast alle, manche nur eines. Kommen dabei weniger als MIN_REGIONS heraus,
// werden zufaellig weitere erzwungen (siehe unten) - eine Insel mit nur einem
// einzigen Gebiet (z.B. nur "field" mit 3h Anbauzeit) macht den Start
// unnoetig zaeh, ohne dass das Spiel dadurch spuerbar leichter wuerde.
const REGION_INCLUSION_CHANCE = 0.6;
const MIN_REGIONS = 2;

// Wie tief ein Kuesten-Gebiet ("sea") vom Kartenrand entfernt liegen darf -
// haelt es glaubwuerdig am Rand statt mitten im Landesinneren.
const COAST_DEPTH_MIN = 5;
const COAST_DEPTH_MAX = 13;

function isValidSpot(x: number, y: number, existing: GeneratedRegion[]): boolean {
  const farFromStart = Math.hypot(x - PLAYER_START.x, y - PLAYER_START.y) >= PLAYER_START_CLEARANCE;
  const farFromOthers = existing.every((r) => Math.hypot(x - r.x, y - r.y) >= MIN_CENTER_DISTANCE);
  return farFromStart && farFromOthers;
}

function randomPosition(existing: GeneratedRegion[]): { x: number; y: number } {
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const x = MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN);
    const y = MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN);
    if (isValidSpot(x, y, existing)) {
      return { x: Math.round(x), y: Math.round(y) };
    }
  }
  // Keine ideale Position in der Attempt-Grenze gefunden - lieber eine mit
  // etwas Ueberlappung zurueckgeben als eine Insel mit weniger Gebieten als
  // gewuerfelt.
  return {
    x: Math.round(MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN)),
    y: Math.round(MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN)),
  };
}

/** Platziert nahe einer der vier Kartenkanten statt frei irgendwo - eine
 * "sea"-Kueste mitten im Landesinneren wirkt sonst unnatuerlich, da die Karte
 * eine Insel darstellt und das Meer den Rand umgibt. */
function randomCoastalPosition(existing: GeneratedRegion[]): { x: number; y: number } {
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const side = Math.floor(Math.random() * 4);
    const depth = COAST_DEPTH_MIN + Math.random() * (COAST_DEPTH_MAX - COAST_DEPTH_MIN);
    const along = MAP_MARGIN + Math.random() * (100 - 2 * MAP_MARGIN);
    let x: number;
    let y: number;
    switch (side) {
      case 0: // oben
        x = along;
        y = MAP_MARGIN + depth;
        break;
      case 1: // rechts
        x = 100 - MAP_MARGIN - depth;
        y = along;
        break;
      case 2: // unten
        x = along;
        y = 100 - MAP_MARGIN - depth;
        break;
      default: // links
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

export function generateIslandRegions(): GeneratedRegion[] {
  const included = REGION_TYPES.filter(() => Math.random() < REGION_INCLUSION_CHANCE);
  if (included.length < MIN_REGIONS) {
    const remaining = REGION_TYPES.filter((t) => !included.includes(t));
    // Fisher-Yates-artiges Ziehen ohne Zuruecklegen, bis genug Gebietstypen
    // feststehen.
    while (included.length < MIN_REGIONS && remaining.length > 0) {
      const i = Math.floor(Math.random() * remaining.length);
      included.push(remaining.splice(i, 1)[0]);
    }
  }

  const regions: GeneratedRegion[] = [];
  for (const type of included) {
    const pos = type === "sea" ? randomCoastalPosition(regions) : randomPosition(regions);
    const radius = Math.round(
      REGION_RADIUS_MIN + Math.random() * (REGION_RADIUS_MAX - REGION_RADIUS_MIN)
    );
    regions.push({ type, x: pos.x, y: pos.y, radius });
  }
  return regions;
}
