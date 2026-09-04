// Spiel-Konstanten fuer zeitbasierte Aktionen. Die Abbauraten fuer
// Hunger/Durst/Energie leben im Worker (worker/index.js) und muessen mit
// diesen Werten nicht identisch sein - hier geht es nur um Aktionsdauern.
export const COLLECT_FIGS_DURATION_MS = 60_000;
export const COLLECT_WOOD_DURATION_MS = 90_000;
export const COLLECT_WATER_DURATION_MS = 45_000;
export const COLLECT_FISH_DURATION_MS = 75_000;
export const COLLECT_STONE_DURATION_MS = 110_000;
export const PLANT_VEGETABLES_DURATION_MS = 3 * 60 * 60 * 1000;
export const SLEEP_DURATION_MS = 4 * 60 * 1000;

export const EAT_FIG_HUNGER_GAIN = 20;
// Fisch braucht laenger zum Sammeln als Feigen (75s statt 60s) und ist die
// herzhaftere Mahlzeit - daher etwas mehr Hunger-Erstattung.
export const EAT_FISH_HUNGER_GAIN = 30;
export const DRINK_WATER_THIRST_GAIN = 20;

export const PLANT_VEGETABLES_FIG_COST = 2;
export const FIREPLACE_WOOD_COST = 5;

// Huette (Basic Hut) -----------------------------------------------------
// Jeder Spieler hat ab der Registrierung bereits eine Huette (siehe
// api/register) - "wilder" Schlaf ohne Standort gibt es nicht mehr. Nur der
// Ausbau auf hoehere Level kostet Rohstoffe.
export const MAX_SHELTER_LEVEL = 5;

/** Rohstoffkosten, um die Huette von `targetLevel - 1` auf `targetLevel`
 * auszubauen (targetLevel 2..MAX_SHELTER_LEVEL). */
export function shelterUpgradeWoodCost(targetLevel: number): number {
  return targetLevel * 10;
}
export function shelterUpgradeStoneCost(targetLevel: number): number {
  return targetLevel * 5;
}

/** Schlafdauer sinkt mit dem Huetten-Level - 15 % kuerzer pro Level ueber dem
 * ersten, gedeckelt bei 60 % Reduktion (ab Level 5). "Mehr Energie mit
 * weniger Schlaf": das Ergebnis bleibt immer voller Energie-Refill, nur der
 * dafuer noetige Zeitaufwand sinkt. */
export function shelterSleepDurationMs(level: number): number {
  const reduction = Math.min(0.6, Math.max(0, level - 1) * 0.15);
  return Math.max(60_000, Math.round(SLEEP_DURATION_MS * (1 - reduction)));
}

// Brunnen (Well) -----------------------------------------------------
// Craftbares Dorf-Gebaeude mit passiver Wasserproduktion ueber Zeit (siehe
// Worker-Tick) - muss wie die Feuerstelle ueber Rohstoffe erarbeitet werden.
export const WELL_WOOD_COST = 8;
export const WELL_STONE_COST = 6;
// 1 Wasser alle 3 Minuten reale Zeit, auch waehrend der Spieler offline ist -
// spuerbarer Bonus, aber deutlich langsamer als aktives Sammeln (45s/Einheit).
export const WELL_WATER_PER_SEC = 1 / 180;

// Kochen am Lagerfeuer -----------------------------------------------------
// Zeitbasierte Aktion wie Sammeln/Anbauen (siehe PendingAction), aber an das
// Lagerfeuer gebunden: verbraucht Fisch + Gemuese + etwas Holz als Brennstoff
// und stillt dafuer spuerbar mehr Hunger als rohes Essen (Fisch +30, Feige
// +20) - der Sinn des Kochens gegenueber dem direkten Verzehr der Zutaten.
export const COOK_MEAL_DURATION_MS = 90_000;
export const COOK_MEAL_FISH_COST = 1;
export const COOK_MEAL_VEGETABLE_COST = 1;
export const COOK_MEAL_WOOD_COST = 2;
export const COOK_MEAL_HUNGER_GAIN = 55;

// Garten (Garden) -----------------------------------------------------
// Craftbares Dorf-Gebaeude wie der Brunnen, nur mit passiver Gemueseproduktion
// statt Wasser (siehe Worker-Tick) - guenstiger als der Brunnen, dafuer auch
// spuerbar langsamer, da Gemuese sonst nur ueber das 3-stuendige Anbauen
// (siehe PLANT_VEGETABLES_DURATION_MS) oder den Marktplatz zu bekommen ist.
export const GARDEN_WOOD_COST = 6;
export const GARDEN_STONE_COST = 4;
export const GARDEN_VEGETABLE_PER_SEC = 1 / 900; // 1 Gemuese alle 15 Minuten reale Zeit

// Vorratshaus (Storehouse) -----------------------------------------------------
// Craftbares Dorf-Gebaeude: durch gelagerte Vorraete sinkt der Hunger- und
// Durstabbau zusaetzlich, multiplikativ mit dem Huetten-Bonus (siehe
// SHELTER_DECAY_FACTOR im Worker) - beide zusammen ergeben eine spuerbare,
// aber nicht uebertriebene Gesamtreduktion.
export const STOREHOUSE_WOOD_COST = 10;
export const STOREHOUSE_STONE_COST = 10;
export const STOREHOUSE_DECAY_FACTOR = 0.85;

// Wege & Strassen (Paths) -----------------------------------------------------
// Frei platzierbare, dekorative Kacheln auf der eigenen Insel. Positionen
// werden auf ein grobes Raster gerastert (siehe PATH_GRID_STEP), damit ein
// erneuter Klick auf (ungefaehr) dieselbe Stelle zuverlaessig dieselbe Kachel
// trifft - der Umschalt-Endpunkt (siehe api/build/path) baut sie damit auf
// Klick oder entfernt sie wieder, je nachdem ob dort schon eine liegt.
export const PATH_GRID_STEP = 5;
export const PATH_STONE_COST = 1;
// Weiche Obergrenze - verhindert unbegrenztes Wachstum der Tabelle, ohne den
// normalen Ausbau eines Dorfwegs spuerbar einzuschraenken.
export const MAX_PATH_TILES = 200;

export function snapToPathGrid(value: number): number {
  return Math.round(value / PATH_GRID_STEP) * PATH_GRID_STEP;
}

// Account -----------------------------------------------------
export const USERNAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Fortschritt (Phase 4) -----------------------------------------------------
export const XP_COLLECT = 10;
export const XP_HARVEST = 25;
export const XP_CRAFT = 30;
export const XP_SLEEP = 20;
export const XP_COOK = 30;
export const XP_PER_LEVEL = 100;

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** 10 % kuerzere Sammelzeiten pro Level (additiv), gedeckelt bei 80 % Reduktion. */
function levelSpeedBonus(level: number): number {
  return Math.min(0.8, (level - 1) * 0.1);
}

/**
 * Effektive Dauer einer Sammel-Aktion (Feige/Holz/Wasser) unter Beruecksichtigung
 * von Nacht- (+50 %), Regen- (Wasser: -30 %) und Level-Bonus. Wird einmalig beim
 * Start der Aktion berechnet und in PendingAction.readyAt festgeschrieben - eine
 * spaeter eintretende Wetteraenderung wirkt sich NICHT rueckwirkend aus.
 */
export function computeCollectDurationMs({
  baseDurationMs,
  isNight,
  weather,
  level,
  isWaterAction,
}: {
  baseDurationMs: number;
  isNight: boolean;
  weather: string;
  level: number;
  isWaterAction: boolean;
}): number {
  let multiplier = 1;
  if (isNight) multiplier *= 1.5;
  if (isWaterAction && weather === "rainy") multiplier *= 0.7;
  multiplier *= 1 - levelSpeedBonus(level);
  return Math.max(1000, Math.round(baseDurationMs * multiplier));
}

// Multiplayer: Marktplatz -----------------------------------------------------
// "coin" ist ein ResourceType wie jeder andere - dadurch funktioniert der
// bestehende, generische Angebots-Marktplatz (offerResource/requestResource)
// automatisch auch fuer "Rohstoff gegen Muenzen" und "Muenzen gegen Rohstoff",
// ganz ohne eigene Kauf-Logik. Der Haendler (siehe MERCHANT_SELL_PRICE/
// MERCHANT_BUY_PRICE) sorgt zusaetzlich dafuer, dass Muenzen auch ganz ohne
// andere Online-Spieler einen garantierten Nutzen haben.
export type ResourceType = "fig" | "wood" | "water" | "vegetable" | "fish" | "stone" | "coin";

export const RESOURCE_TYPES: ResourceType[] = [
  "fig",
  "wood",
  "water",
  "vegetable",
  "fish",
  "stone",
  "coin",
];

// Rohstoffe, die der Haendler an- und verkauft - "coin" selbst ausgenommen.
export const TRADABLE_RESOURCE_TYPES: Exclude<ResourceType, "coin">[] = [
  "fig",
  "wood",
  "water",
  "vegetable",
  "fish",
  "stone",
];

// Als praezise gemapptes Objekt statt eines weiten Record<ResourceType, ...> -
// dadurch liefert z.B. RESOURCE_FIELD["fig"] den literalen Typ "figCount"
// statt der Vereinigung aller moeglichen Feldnamen, was TypeScript erlaubt,
// den Rueckgabetyp an einer Indexstelle wie RESOURCE_FIELD[REGION_RESOURCE[t]]
// korrekt auf "coinCount" auszuschliessen (kein Gebiet liefert Muenzen).
export const RESOURCE_FIELD = {
  fig: "figCount",
  wood: "woodCount",
  water: "waterCount",
  vegetable: "vegetableCount",
  fish: "fishCount",
  stone: "stoneCount",
  coin: "coinCount",
} as const satisfies Record<ResourceType, string>;

// Sprachabhaengige Labels leben im i18n-Dictionary (dict.resources) - hier nur
// das sprachneutrale Icon.
export const RESOURCE_ICON: Record<ResourceType, string> = {
  fig: "🌿",
  wood: "🪵",
  water: "💧",
  vegetable: "🥕",
  fish: "🐟",
  stone: "🪨",
  coin: "🪙",
};

export function isResourceType(value: string): value is ResourceType {
  return (RESOURCE_TYPES as string[]).includes(value);
}

/** Wie isResourceType, aber ohne "coin" - fuer Stellen, an denen nur echte
 * (haendelbare) Rohstoffe erlaubt sind, z.B. der Haendler. */
export function isTradableResourceType(value: string): value is Exclude<ResourceType, "coin"> {
  return (TRADABLE_RESOURCE_TYPES as string[]).includes(value);
}

type ResourceCounts = {
  figCount: number;
  woodCount: number;
  waterCount: number;
  vegetableCount: number;
  fishCount: number;
  stoneCount: number;
  coinCount: number;
};

export function getResourceAmount(player: ResourceCounts, resource: ResourceType): number {
  switch (resource) {
    case "fig":
      return player.figCount;
    case "wood":
      return player.woodCount;
    case "water":
      return player.waterCount;
    case "vegetable":
      return player.vegetableCount;
    case "fish":
      return player.fishCount;
    case "stone":
      return player.stoneCount;
    case "coin":
      return player.coinCount;
  }
}

/** Prisma-Update-Fragment, das den passenden Bestandszaehler um `delta` verschiebt. */
export function resourceDelta(resource: ResourceType, delta: number) {
  switch (resource) {
    case "fig":
      return { figCount: { increment: delta } };
    case "wood":
      return { woodCount: { increment: delta } };
    case "water":
      return { waterCount: { increment: delta } };
    case "vegetable":
      return { vegetableCount: { increment: delta } };
    case "fish":
      return { fishCount: { increment: delta } };
    case "stone":
      return { stoneCount: { increment: delta } };
    case "coin":
      return { coinCount: { increment: delta } };
  }
}

// Waehrung: "Alte Muenzen" -----------------------------------------------------
// Startbestand fuer neue Accounts (siehe api/register) - genug, um den
// Haendler sofort auszuprobieren UND auf einer kargen Insel (wenige Gebiete)
// den Fruehstart per Zukauf zu ueberbruecken, statt erst muehsam Muenzen zu
// finden.
export const STARTING_COIN_COUNT = 30;

// Chance, beim Abschluss einer Sammel-Aktion (nicht beim Anbauen/Schlafen)
// zusaetzlich eine Muenze zu finden - kleiner, verlaesslicher Muenzstrom, der
// nicht von anderen Online-Spielern abhaengt (siehe worker/index.js).
export const GATHER_COIN_CHANCE = 0.12;

// Haendler-Preise pro Einheit, grob an der Sammelzeit orientiert (laengere
// Sammeldauer = wertvoller). Verkaufspreis < Kaufpreis (Haendler-Marge),
// damit Muenzen nicht durch Hin-und-her-Handeln beliebig vermehrbar sind.
export const MERCHANT_SELL_PRICE: Record<Exclude<ResourceType, "coin">, number> = {
  fig: 1,
  water: 1,
  fish: 2,
  wood: 2,
  stone: 3,
  vegetable: 3,
};

export const MERCHANT_BUY_PRICE: Record<Exclude<ResourceType, "coin">, number> = {
  fig: 2,
  water: 2,
  fish: 3,
  wood: 3,
  stone: 5,
  vegetable: 5,
};

// "Bank": dynamische Preisanpassung -----------------------------------------------------
// Die Basispreise oben gelten nur im Gleichgewicht (Multiplikatoren = 1). Der
// Worker berechnet laufend zwei Multiplikatoren aus dem Verhaeltnis
// "insgesamt im Umlauf befindliche Muenzen" zu "insgesamt im Umlauf
// befindliche Rohstoffe" (ueber alle Spieler summiert - je mehr Spieler,
// desto mehr fliesst automatisch in beide Summen ein, ein separater
// Spieleranzahl-Faktor ist dadurch nicht noetig) und speichert sie in
// WorldState. Design-Ziel bei "gesundem" Gleichgewicht: etwa
// REFERENCE_COINS_PER_RESOURCE Muenzen pro im Umlauf befindlicher
// Rohstoff-Einheit.
//
// Werden Muenzen relativ zu den Rohstoffen knapp (Deflation, z.B. weil viel
// gebaut/gekauft wurde), zahlt die Bank beim Verkauf mehr aus und verlangt
// beim Kauf weniger - sie spritzt aktiv Muenzen in den Umlauf, um den Handel
// wieder in Gang zu bringen. Werden Muenzen dagegen relativ reichlich
// (Inflation), zahlt sie beim Verkauf weniger aus und verlangt beim Kauf mehr
// - sie bremst so weiteres Muenz-Wachstum und macht reines Bank-Arbitrage
// unattraktiver, statt tatenlos zuzusehen.
export const REFERENCE_COINS_PER_RESOURCE = 2;
export const CURRENCY_MULTIPLIER_MIN = 0.4;
export const CURRENCY_MULTIPLIER_MAX = 2.5;

export function clampCurrencyMultiplier(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(CURRENCY_MULTIPLIER_MAX, Math.max(CURRENCY_MULTIPLIER_MIN, value));
}

/** Effektiver Verkaufspreis (was der Spieler pro Einheit bekommt), nie unter 1. */
export function effectiveMerchantSellPrice(
  resource: Exclude<ResourceType, "coin">,
  sellMultiplier: number
): number {
  return Math.max(1, Math.round(MERCHANT_SELL_PRICE[resource] * sellMultiplier));
}

/** Effektiver Kaufpreis (was der Spieler pro Einheit zahlt) - immer echt
 * hoeher als der aktuelle Verkaufspreis desselben Rohstoffs, damit reines
 * Kaufen-und-sofort-wieder-Verkaufen nie profitabel ist, unabhaengig davon,
 * wie sich die beiden Multiplikatoren unabhaengig voneinander bewegen. */
export function effectiveMerchantBuyPrice(
  resource: Exclude<ResourceType, "coin">,
  buyMultiplier: number,
  currentSellPrice: number
): number {
  const raw = Math.round(MERCHANT_BUY_PRICE[resource] * buyMultiplier);
  return Math.max(currentSellPrice + 1, raw);
}

// Karte & Bewegung -----------------------------------------------------
export type Position = { x: number; y: number };

// Ressourcen-Gebiete statt fester Einzel-Punkte: jede Insel wird bei der
// Registrierung zufaellig mit einer Teilmenge dieser Gebiete bestueckt (siehe
// islandGen.ts) - wer z.B. keinen "sea"-Gebiet auf der eigenen Insel hat, muss
// Fisch ueber den Marktplatz eintauschen statt ihn selbst zu sammeln.
export type RegionType = "grove" | "forest" | "spring" | "field" | "sea" | "quarry";

export const REGION_TYPES: RegionType[] = ["grove", "forest", "spring", "field", "sea", "quarry"];

export const REGION_RESOURCE: Record<RegionType, Exclude<ResourceType, "coin">> = {
  grove: "fig",
  forest: "wood",
  spring: "water",
  field: "vegetable",
  sea: "fish",
  quarry: "stone",
};

export type GatherActionType =
  | "collect_figs"
  | "collect_wood"
  | "collect_water"
  | "collect_fish"
  | "collect_stone"
  | "plant_vegetables";

export const REGION_ACTION: Record<RegionType, GatherActionType> = {
  grove: "collect_figs",
  forest: "collect_wood",
  spring: "collect_water",
  field: "plant_vegetables",
  sea: "collect_fish",
  quarry: "collect_stone",
};

// Umkehrung von REGION_ACTION - jede Sammel-Aktion gehoert zu genau einem
// Gebietstyp, daher vollstaendig (kein Partial noetig).
export const ACTION_REGION: Record<GatherActionType, RegionType> = {
  collect_figs: "grove",
  collect_wood: "forest",
  collect_water: "spring",
  collect_fish: "sea",
  collect_stone: "quarry",
  plant_vegetables: "field",
};

export const REGION_ICON: Record<RegionType, string> = {
  grove: "🌴",
  forest: "🌲",
  spring: "💧",
  field: "🥕",
  sea: "🌊",
  quarry: "⛰️",
};

// Radius-Spanne eines Gebiets auf der Karte (Prozent 0..100 Luftlinie) - jedes
// Gebiet bekommt bei der Erzeugung (siehe islandGen.ts) einen zufaelligen Wert
// aus dieser Spanne, damit Gebiete unterschiedlich groß wirken statt alle
// gleich gestanzt zu sein. Innerhalb des jeweils gespeicherten Radius kann die
// zugehoerige Aktion gestartet werden.
export const REGION_RADIUS_MIN = 8;
export const REGION_RADIUS_MAX = 13;

// Fallback, falls ein Gebaeude als "gebaut" markiert ist, aber (z.B. aus
// einer aelteren Version) noch keine Position gespeichert hat.
export const DEFAULT_FIREPLACE_POSITION: Position = { x: 52, y: 74 };
export const DEFAULT_SHELTER_POSITION: Position = { x: 62, y: 78 };
export const DEFAULT_WELL_POSITION: Position = { x: 57, y: 71 };
export const DEFAULT_GARDEN_POSITION: Position = { x: 44, y: 72 };
export const DEFAULT_STOREHOUSE_POSITION: Position = { x: 67, y: 66 };

// Wie nah (in Prozentpunkten Luftlinie) man einer punktgenauen Station (z.B.
// dem selbst gebauten Unterschlupf) sein muss, um eine dort gebundene Aktion
// zu starten. Fuer Gebiete (Wald, Meer, ...) gilt stattdessen deren eigener
// `radius` - siehe REGION_RADIUS.
export const STATION_PROXIMITY_RADIUS = 18;

export function distanceBetween(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isNearPosition(
  a: Position,
  b: Position,
  radius: number = STATION_PROXIMITY_RADIUS
): boolean {
  return distanceBetween(a, b) <= radius;
}

// Gemaechliche, spuerbare Laufgeschwindigkeit statt sofortigem "Teleport".
export const WALK_SPEED_PERCENT_PER_SEC = 9;
export const MIN_WALK_DURATION_MS = 500;
export const MAX_WALK_DURATION_MS = 9000;

export function computeWalkDurationMs(distancePercent: number): number {
  const ms = (distancePercent / WALK_SPEED_PERCENT_PER_SEC) * 1000;
  return Math.min(MAX_WALK_DURATION_MS, Math.max(MIN_WALK_DURATION_MS, Math.round(ms)));
}
