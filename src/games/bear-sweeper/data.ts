import type { Difficulty } from "../../core/difficulty";
import type { StoredPuzzle } from "./codec";
import puzzleData from "./puzzles.json";

export const BEARS_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

export type BearData = Record<Difficulty, StoredPuzzle[]>;

export const bearData = puzzleData as BearData;
