import { t } from "./messages";

export interface Named {
  id: string;
  label: string;
}

export const WEATHERS: readonly Named[] = [
  { id: "sunny", label: "Sunny" },
  { id: "cloudy", label: "Cloudy" },
  { id: "rainy", label: "Rainy" },
  { id: "windy", label: "Windy" },
  { id: "snowy", label: "Snowy" },
];

export const TRIPS: readonly Named[] = [
  { id: "hike", label: "Hike" },
  { id: "kayak", label: "Kayak" },
  { id: "camp", label: "Camp" },
  { id: "climb", label: "Climb" },
  { id: "ski", label: "Ski" },
];

export const FIT: readonly (readonly number[])[] = [
  [3, 2, 0, 1, 1],
  [3, 1, 2, 0, 0],
  [2, 3, 0, 0, 2],
  [2, 3, 0, 1, 0],
  [0, 1, 0, 1, 3],
];

export const MAX_FIT = 3;

export const DAY_NAMES: readonly Named[] = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
];

export function readFit(trip: number, weather: number): number {
  return FIT[trip][weather];
}

const WEATHER_KEYS = [
  "weather.name.sunny",
  "weather.name.cloudy",
  "weather.name.rainy",
  "weather.name.windy",
  "weather.name.snowy",
] as const;

const TRIP_KEYS = [
  "weather.trip.hike",
  "weather.trip.kayak",
  "weather.trip.camp",
  "weather.trip.climb",
  "weather.trip.ski",
] as const;

const DAY_KEYS = [
  "weather.day.mon",
  "weather.day.tue",
  "weather.day.wed",
  "weather.day.thu",
  "weather.day.fri",
  "weather.day.sat",
  "weather.day.sun",
] as const;

const SHORT_DAY_KEYS = [
  "weather.short.mon",
  "weather.short.tue",
  "weather.short.wed",
  "weather.short.thu",
  "weather.short.fri",
  "weather.short.sat",
  "weather.short.sun",
] as const;

export function readWeatherLabel(weather: number): string {
  return t(WEATHER_KEYS[weather]);
}

export function readTripLabel(trip: number): string {
  return t(TRIP_KEYS[trip]);
}

export function readDayName(day: number): string {
  return t(DAY_KEYS[day]);
}

export function readShortDayName(day: number): string {
  return t(SHORT_DAY_KEYS[day]);
}
