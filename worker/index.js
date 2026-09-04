const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const TICK_INTERVAL_MS = 30_000;
const WORLD_ID = "world";

// Abbauraten: Punkte pro Sekunde realer Zeit. Bewusst auf Tage/Wochen statt
// Stunden ausgelegt - das Spiel soll man gelegentlich reinschauen koennen,
// ohne dass die Werte waehrend eines normalen Arbeitstags (oder laenger)
// schon komplett auf 0 gefallen sind. Mit der immer vorhandenen Basis-Huette
// (SHELTER_DECAY_FACTOR) dauert der volle Abbau von 100 auf 0:
//   Hunger  ~4 Tage, Durst ~3 Tage. Energie faellt erst danach (siehe unten)
//   und dann ueber ~12 Stunden - eine spuerbare, aber nicht schlagartige
//   "Notlage"-Phase statt eines ploetzlichen Total-Ausfalls.
const HUNGER_LOSS_PER_SEC = 1 / 2700; // 1 Punkt pro 45 Minuten
const THIRST_LOSS_PER_SEC = 1 / 2100; // 1 Punkt pro 35 Minuten
const ENERGY_LOSS_PER_SEC = 1 / 420; // 1 Punkt pro 7 Minuten, nur bei Hunger oder Durst = 0
const SHELTER_DECAY_FACTOR = 0.8; // Huette: 20 % langsamerer Abbau, unabhaengig vom Level
const WELL_WATER_PER_SEC = 1 / 180; // Brunnen: 1 Wasser alle 3 Minuten reale Zeit
const WELL_RAIN_MULTIPLIER = 2.5; // Bei Regen sammelt der Brunnen entsprechend schneller
const GARDEN_VEGETABLE_PER_SEC = 1 / 900; // Garten: 1 Gemuese alle 15 Minuten reale Zeit
const STOREHOUSE_DECAY_FACTOR = 0.85; // Vorratshaus: zusaetzlich 15 % langsamerer Abbau, multiplikativ mit der Huette
const COOK_MEAL_HUNGER_GAIN = 55; // Gekochte Mahlzeit: deutlich mehr als rohes Essen (Fisch +30, Feige +20)
const XP_COOK = 30;
const GATHER_COIN_CHANCE = 0.12; // Chance auf einen Muenzfund je Sammel-Aktion

// "Bank": dynamische Haendler-Preise - siehe REFERENCE_COINS_PER_RESOURCE in
// app/src/lib/game.ts fuer die ausfuehrliche Begruendung (hier dupliziert,
// da dieses Script ohne TS-Compile-Schritt laeuft, siehe Muster bei den
// XP-Konstanten weiter unten).
const REFERENCE_COINS_PER_RESOURCE = 2;
const CURRENCY_MULTIPLIER_MIN = 0.4;
const CURRENCY_MULTIPLIER_MAX = 2.5;
// Wie oft ein Preis-Datenpunkt fuer den /economy-Graphen geschrieben wird -
// deutlich seltener als der 30s-Tick, damit die Tabelle ueber Wochen nicht
// ausufert, aber engmaschig genug fuer einen aussagekraeftigen Verlauf.
const PRICE_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;
// Aeltere Datenpunkte werden verworfen - 90 Tage Verlauf reichen fuer die
// "Tage bis Wochen"-Spielweise locker aus.
const PRICE_SNAPSHOT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

// Weltzustand: voller Tag/Nacht-Zyklus alle 10 Minuten (Haelfte Tag, Haelfte Nacht).
const CYCLE_DURATION_MS = 10 * 60 * 1000;
const WEATHER_ROLL_MIN_MS = 2 * 60 * 1000;
const WEATHER_ROLL_MAX_MS = 4 * 60 * 1000;
// Grobe Anlehnung an die reale Wetterhaeufigkeit auf Malta (mediterranes
// Klima: ueberwiegend sonnig/klar, Wolken durchaus haeufig, Regen dagegen
// vergleichsweise selten). Jeder Wurf ist unabhaengig vom vorherigen - keine
// Serien-/Persistenz-Logik, wie ausdruecklich gewuenscht. "sunny" meint hier
// den Bewoelkungszustand (klarer Himmel) unabhaengig von Tag/Nacht - dass
// nachts keine Sonnenscheibe zu sehen ist, uebernimmt allein die Anzeige
// (IslandScene), nicht dieser Weltzustand.
const WEATHER_WEIGHTS = { sunny: 0.68, cloudy: 0.2, rainy: 0.12 };

// XP-Vergabe je abgeschlossener Aktion.
const XP_COLLECT = 10;
const XP_HARVEST = 25;
const XP_SLEEP = 20;
const XP_PER_LEVEL = 100;

function levelForXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

async function grantXp(tx, playerId, amount) {
  const player = await tx.playerState.findUniqueOrThrow({ where: { id: playerId } });
  const xp = player.xp + amount;
  await tx.playerState.update({
    where: { id: playerId },
    data: { xp, level: levelForXp(xp) },
  });
}

/** Sammel-Effekt fuer ein Rohstofffeld: +1 Einheit, plus Chance auf einen
 * zusaetzlichen Muenzfund (siehe GATHER_COIN_CHANCE). */
function collectEffect(field) {
  return async (tx, playerId) => {
    const data = { [field]: { increment: 1 } };
    if (Math.random() < GATHER_COIN_CHANCE) {
      data.coinCount = { increment: 1 };
    }
    await tx.playerState.update({ where: { id: playerId }, data });
    await grantXp(tx, playerId, XP_COLLECT);
  };
}

const ACTION_EFFECTS = {
  collect_figs: collectEffect("figCount"),
  collect_wood: collectEffect("woodCount"),
  collect_water: collectEffect("waterCount"),
  collect_fish: collectEffect("fishCount"),
  collect_stone: collectEffect("stoneCount"),
  plant_vegetables: async (tx, playerId) => {
    const player = await tx.playerState.findUniqueOrThrow({ where: { id: playerId } });
    await tx.playerState.update({
      where: { id: playerId },
      data: {
        vegetableCount: { increment: 8 },
        hunger: Math.min(100, player.hunger + 15),
      },
    });
    await grantXp(tx, playerId, XP_HARVEST);
  },
  sleep: async (tx, playerId) => {
    await tx.playerState.update({
      where: { id: playerId },
      data: { energy: 100 },
    });
    await grantXp(tx, playerId, XP_SLEEP);
  },
  // Zutaten (Fisch/Gemuese/Holz) sind bereits beim Start der Aktion abgezogen
  // worden (siehe api/actions/cook-meal) - hier wird nur noch der Hunger-
  // Effekt der fertigen Mahlzeit angewandt.
  cook_meal: async (tx, playerId) => {
    const player = await tx.playerState.findUniqueOrThrow({ where: { id: playerId } });
    await tx.playerState.update({
      where: { id: playerId },
      data: { hunger: Math.min(100, player.hunger + COOK_MEAL_HUNGER_GAIN) },
    });
    await grantXp(tx, playerId, XP_COOK);
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomWeatherIntervalMs() {
  return WEATHER_ROLL_MIN_MS + Math.random() * (WEATHER_ROLL_MAX_MS - WEATHER_ROLL_MIN_MS);
}

/** Gewichteter Zufallswurf ueber die uebergebenen {Wert: Gewicht}-Paare - je
 * Aufruf komplett unabhaengig vom vorherigen Ergebnis (kein Persistenz-Bias). */
function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function rollWeather() {
  return weightedRandom(WEATHER_WEIGHTS);
}

async function applyNeedsDecay(now, isRaining) {
  const players = await prisma.playerState.findMany();

  for (const player of players) {
    const elapsedSec = (now.getTime() - player.lastTickAt.getTime()) / 1000;
    if (elapsedSec <= 0) continue;

    let decayFactor = player.hasShelter ? SHELTER_DECAY_FACTOR : 1;
    if (player.hasStorehouse) decayFactor *= STOREHOUSE_DECAY_FACTOR;
    const hunger = clamp(
      player.hunger - elapsedSec * HUNGER_LOSS_PER_SEC * decayFactor,
      0,
      100
    );
    const thirst = clamp(
      player.thirst - elapsedSec * THIRST_LOSS_PER_SEC * decayFactor,
      0,
      100
    );

    let energy = player.energy;
    if (player.hunger <= 0 || player.thirst <= 0) {
      energy = clamp(energy - elapsedSec * ENERGY_LOSS_PER_SEC, 0, 100);
    }

    const data = { hunger, thirst, energy, lastTickAt: now };

    // Brunnen: passive Wasserproduktion ueber die tatsaechlich vergangene Zeit,
    // auch waehrend der Spieler offline war. Bruchteile werden in
    // wellWaterAccum aufgesammelt, bis eine ganze Einheit erreicht ist.
    if (player.hasWell) {
      const wellRate = WELL_WATER_PER_SEC * (isRaining ? WELL_RAIN_MULTIPLIER : 1);
      const accumulated = player.wellWaterAccum + elapsedSec * wellRate;
      const wholeUnits = Math.floor(accumulated);
      data.wellWaterAccum = accumulated - wholeUnits;
      if (wholeUnits > 0) {
        data.waterCount = { increment: wholeUnits };
      }
    }

    // Garten: passive Gemueseproduktion nach demselben Bruchteils-Muster wie
    // der Brunnen oben.
    if (player.hasGarden) {
      const accumulated = player.gardenVegAccum + elapsedSec * GARDEN_VEGETABLE_PER_SEC;
      const wholeUnits = Math.floor(accumulated);
      data.gardenVegAccum = accumulated - wholeUnits;
      if (wholeUnits > 0) {
        data.vegetableCount = { increment: wholeUnits };
      }
    }

    await prisma.playerState.update({
      where: { id: player.id },
      data,
    });
  }
}

async function completeDueActions(now) {
  const dueActions = await prisma.pendingAction.findMany({
    where: { readyAt: { lte: now } },
  });

  for (const action of dueActions) {
    const applyEffect = ACTION_EFFECTS[action.type];

    await prisma.$transaction(async (tx) => {
      if (applyEffect) {
        await applyEffect(tx, action.playerId);
      }
      await tx.pendingAction.delete({ where: { id: action.id } });
    });
  }

  return dueActions.length;
}

function clampCurrencyMultiplier(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(CURRENCY_MULTIPLIER_MAX, Math.max(CURRENCY_MULTIPLIER_MIN, value));
}

/**
 * "Bank": leitet aus dem aktuellen Verhaeltnis von umlaufenden Muenzen zu
 * umlaufenden Rohstoffen (ueber alle Spieler summiert) zwei Preisfaktoren ab.
 * Werden Muenzen relativ knapp (Deflation), zahlt die Bank beim Verkauf mehr
 * und verlangt beim Kauf weniger - sie spritzt aktiv Liquiditaet in den
 * Umlauf. Werden Muenzen relativ reichlich (Inflation), zahlt sie weniger
 * und verlangt mehr - sie bremst so aktiv weiteres Muenz-Wachstum, statt
 * tatenlos zuzusehen. Bei exaktem Gleichgewicht bleiben beide Faktoren 1.
 */
async function computeCurrencyMultipliers() {
  const agg = await prisma.playerState.aggregate({
    _sum: {
      coinCount: true,
      figCount: true,
      woodCount: true,
      waterCount: true,
      vegetableCount: true,
      fishCount: true,
      stoneCount: true,
    },
    _count: { id: true },
  });

  const playerCount = agg._count.id || 1;
  const totalCoins = agg._sum.coinCount ?? 0;
  const totalResources =
    (agg._sum.figCount ?? 0) +
    (agg._sum.woodCount ?? 0) +
    (agg._sum.waterCount ?? 0) +
    (agg._sum.vegetableCount ?? 0) +
    (agg._sum.fishCount ?? 0) +
    (agg._sum.stoneCount ?? 0);

  // Untergrenze fuer den Nenner, skaliert mit der Spielerzahl - verhindert
  // extreme Ausschlaege, wenn frueh im Spiel kaum Rohstoffe im Umlauf sind.
  const resourceFloor = playerCount * 5;
  const coinsPerResource = totalCoins / Math.max(resourceFloor, totalResources);
  const normalizedRatio = coinsPerResource / REFERENCE_COINS_PER_RESOURCE;

  return {
    sellMultiplier: clampCurrencyMultiplier(1 / Math.max(0.05, normalizedRatio)),
    buyMultiplier: clampCurrencyMultiplier(normalizedRatio),
  };
}

async function advanceWorld(now, world) {
  if (!world) {
    await prisma.worldState.create({
      data: {
        id: WORLD_ID,
        cyclePositionMs: 0,
        isNight: false,
        weather: "sunny",
        nextWeatherRollAt: new Date(now.getTime() + randomWeatherIntervalMs()),
        lastTickAt: now,
      },
    });
    return;
  }

  const elapsedMs = now.getTime() - world.lastTickAt.getTime();
  const cyclePositionMs =
    elapsedMs > 0
      ? (world.cyclePositionMs + elapsedMs) % CYCLE_DURATION_MS
      : world.cyclePositionMs;
  const isNight = cyclePositionMs >= CYCLE_DURATION_MS / 2;

  let weather = world.weather;
  let nextWeatherRollAt = world.nextWeatherRollAt;
  if (now >= world.nextWeatherRollAt) {
    weather = rollWeather();
    nextWeatherRollAt = new Date(now.getTime() + randomWeatherIntervalMs());
  }

  const { sellMultiplier, buyMultiplier } = await computeCurrencyMultipliers();

  const data = {
    cyclePositionMs,
    isNight,
    weather,
    nextWeatherRollAt,
    lastTickAt: now,
    currencySellMultiplier: sellMultiplier,
    currencyBuyMultiplier: buyMultiplier,
  };

  const sinceLastSnapshot = now.getTime() - world.lastPriceSnapshotAt.getTime();
  if (sinceLastSnapshot >= PRICE_SNAPSHOT_INTERVAL_MS) {
    data.lastPriceSnapshotAt = now;
    await prisma.priceSnapshot.create({ data: { sellMultiplier, buyMultiplier } });
    await prisma.priceSnapshot.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - PRICE_SNAPSHOT_RETENTION_MS) } },
    });
  }

  await prisma.worldState.update({ where: { id: WORLD_ID }, data });
}

async function tick() {
  const now = new Date();
  try {
    const world = await prisma.worldState.findUnique({ where: { id: WORLD_ID } });
    const isRaining = world?.weather === "rainy";
    await applyNeedsDecay(now, isRaining);
    await advanceWorld(now, world);
    const completed = await completeDueActions(now);
    console.log(
      `Worker-Tick ${now.toISOString()} - Bedürfnisse aktualisiert, ${completed} Aktion(en) abgeschlossen`
    );
  } catch (err) {
    console.error("Worker-Tick fehlgeschlagen:", err);
  }
}

console.log("Worker gestartet");
tick();
setInterval(tick, TICK_INTERVAL_MS);

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
