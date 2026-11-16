import puzzlesData from "./puzzles.json";
import type { MysteryPlacePuzzle } from "./types";

export const PUZZLE_LAUNCH_DATE = new Date("2026-11-15T00:00:00Z");

export const puzzles: MysteryPlacePuzzle[] = puzzlesData as MysteryPlacePuzzle[];
