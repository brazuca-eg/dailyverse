import type { Difficulty } from "../../core/difficulty";
import type { StoredPuzzle } from "./codec";
import puzzleData from "./puzzles.json";

export const SWITCHBACK_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

export type SwitchbackData = Record<Difficulty, StoredPuzzle[]>;

export const switchbackData = puzzleData as SwitchbackData;
