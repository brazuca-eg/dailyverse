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

export function readShortDayName(day: number): string {
  return DAY_NAMES[day].label.slice(0, 3);
}
