import { ACTION_REGION, type GatherActionType, type RegionType } from "@/lib/game";
import type { Dictionary } from "./dictionary-type";
import type { Locale } from "./locales";

function isGatherActionType(value: string): value is GatherActionType {
  return value in ACTION_REGION;
}

/** Loest einen Stations-Schluessel (z.B. "collect_wood" oder "sleep") in den
 * lokalisierten Anzeigenamen auf - Sammel-Aktionen ueber das Gebiet, in dem
 * sie stattfinden, "sleep" ueber den eigenen (punktgenauen) Unterschlupf. */
function stationLabel(dict: Dictionary, station: string): string {
  if (station === "sleep") return dict.dashboard.island.shelter;
  if (station === "cook_meal") return dict.dashboard.island.fireplace;
  if (isGatherActionType(station)) {
    return dict.dashboard.island.regionLabel[ACTION_REGION[station]];
  }
  return "";
}

/**
 * Uebersetzt eine API-Fehlerantwort ({ errorCode, ...meta }) in lokalisierten
 * Text. Faellt auf die generische Meldung zurueck, falls der Code unbekannt ist.
 * `locale` wird nur fuer Codes mit eingebettetem Datum (z.B. USERNAME_COOLDOWN)
 * gebraucht - optional, damit bestehende Aufrufstellen unveraendert bleiben.
 */
export function translateApiError(
  dict: Dictionary,
  data:
    | { errorCode?: string; station?: string; region?: string; nextAllowedAt?: string }
    | null
    | undefined,
  locale?: Locale
): string {
  const code = data?.errorCode;
  if (!code) return dict.errors.GENERIC;

  if (code === "TOO_FAR_AWAY") {
    const stationName = data?.station ? stationLabel(dict, data.station) : "";
    return dict.errors.TOO_FAR_AWAY(stationName);
  }

  if (code === "NO_REGION_ON_ISLAND") {
    const region = data?.region as RegionType | undefined;
    const regionName = region ? dict.dashboard.island.regionLabel[region] : "";
    return dict.errors.NO_REGION_ON_ISLAND(regionName);
  }

  if (code === "USERNAME_COOLDOWN") {
    const date = data?.nextAllowedAt
      ? new Date(data.nextAllowedAt).toLocaleDateString(locale ?? "de")
      : "";
    return dict.errors.USERNAME_COOLDOWN(date);
  }

  const entry = (dict.errors as Record<string, unknown>)[code];
  return typeof entry === "string" ? entry : dict.errors.GENERIC;
}
