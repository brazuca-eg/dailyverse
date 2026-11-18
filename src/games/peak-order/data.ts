import puzzleData from "./puzzles.json";
import type { PeakData } from "./types";

export const PEAK_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

export const peakData = puzzleData as unknown as PeakData;
