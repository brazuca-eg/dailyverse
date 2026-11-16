import flagsData from "./flags.json";
import { buildFlagSchedule, SCHEDULE_SEED } from "./schedule";
import type { FlagEntry } from "./types";

export const flagEntries: FlagEntry[] = flagsData as FlagEntry[];

export const flagSchedule: FlagEntry[] = buildFlagSchedule(flagEntries, SCHEDULE_SEED);

export const FLAG_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");
