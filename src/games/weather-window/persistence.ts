import { createStateStorage } from "../../core/gameStorage";
import { isNonNegativeInteger, isOneOf, isRecord } from "../../core/guards";
import type { GameStatus } from "../../core/guessing";
import { PHASES, type WeatherState } from "./game";

const STATUSES: readonly GameStatus[] = ["playing", "won", "lost"];
const MIN_TRIPS = 2;
const MAX_TRIPS = 4;
const MAX_DAYS = 7;

export function isWeatherState(value: unknown): value is WeatherState {
  if (!isRecord(value)) {
    return false;
  }
  const { puzzleId, phase, plan, peeksUsed, status } = value;
  return (
    typeof puzzleId === "string" &&
    isOneOf(PHASES, phase) &&
    Array.isArray(plan) &&
    plan.length >= MIN_TRIPS &&
    plan.length <= MAX_TRIPS &&
    plan.every((day) => Number.isInteger(day) && day >= -1 && day < MAX_DAYS) &&
    isNonNegativeInteger(peeksUsed) &&
    isOneOf(STATUSES, status)
  );
}

export const weatherWindowStorage = createStateStorage("weather-window", isWeatherState);
