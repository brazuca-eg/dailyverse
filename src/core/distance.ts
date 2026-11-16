import type { Country } from "./types";

export type Coordinates = Pick<Country, "lat" | "lng">;

export type CompassDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export interface CorrectFeedback {
  isCorrect: true;
}

export interface IncorrectFeedback {
  isCorrect: false;
  distanceKm: number;
  direction: CompassDirection;
}

export type GuessFeedback = CorrectFeedback | IncorrectFeedback;

const EARTH_RADIUS_KM = 6371;
const MAX_DISTANCE_KM = 20000;
export const COMPASS_DIRECTIONS: readonly CompassDirection[] = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function calculateDistanceKm(from: Coordinates, to: Coordinates): number {
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function calculateBearingDegrees(from: Coordinates, to: Coordinates): number {
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const y = Math.sin(deltaLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function toCompassDirection(bearingDegrees: number): CompassDirection {
  const normalized = ((bearingDegrees % 360) + 360) % 360;
  return COMPASS_DIRECTIONS[Math.round(normalized / 45) % 8];
}

export function calculateProximityPercent(distanceKm: number): number {
  const proximity = Math.round((1 - distanceKm / MAX_DISTANCE_KM) * 100);
  return Math.min(100, Math.max(0, proximity));
}

export function compareGuessToAnswer(guess: Country, answer: Country): GuessFeedback {
  if (guess.code === answer.code) {
    return { isCorrect: true };
  }
  return {
    isCorrect: false,
    distanceKm: Math.round(calculateDistanceKm(guess, answer)),
    direction: toCompassDirection(calculateBearingDegrees(guess, answer)),
  };
}
