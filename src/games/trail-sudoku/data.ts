import type { Difficulty } from "../../core/difficulty";
import puzzleData from "./puzzles.json";

export const SUDOKU_LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");

export type SudokuData = Record<Difficulty, string[]>;

export const sudokuData = puzzleData as SudokuData;
