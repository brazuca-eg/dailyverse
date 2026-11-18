import { MAX_FIT, readFit } from "./catalogue";
import { UNPLACED, type WeatherPuzzle } from "./types";

export interface PuzzleAnalysis {
  best: number;
  rival: number;
  averageShare: number;
  greedy: number;
  bestPlan: number[];
}

const plansByShape = new Map<string, number[][]>();
const analyses = new WeakMap<WeatherPuzzle, PuzzleAnalysis>();

export function listPlans(dayCount: number, tripCount: number): number[][] {
  const key = `${dayCount}:${tripCount}`;
  const known = plansByShape.get(key);
  if (known) {
    return known;
  }
  const plans = Array.from({ length: tripCount }).reduce<number[][]>(
    (partial) =>
      partial.flatMap((plan) =>
        Array.from({ length: dayCount }, (_, day) => day)
          .filter((day) => !plan.includes(day))
          .map((day) => [...plan, day]),
      ),
    [[]],
  );
  plansByShape.set(key, plans);
  return plans;
}

export function scorePlan(puzzle: WeatherPuzzle, plan: readonly number[]): number {
  return plan.reduce(
    (total, day, trip) =>
      day === UNPLACED ? total : total + readFit(puzzle.trips[trip], puzzle.weather[day]),
    0,
  );
}

export function readMaxPoints(puzzle: WeatherPuzzle): number {
  return puzzle.trips.length * MAX_FIT;
}

function planGreedily(puzzle: WeatherPuzzle): number[] {
  return puzzle.trips.reduce<number[]>((plan, trip) => {
    const free = puzzle.weather
      .map((weather, day) => ({ day, fit: readFit(trip, weather) }))
      .filter(({ day }) => !plan.includes(day));
    const top = free.reduce((chosen, option) => (option.fit > chosen.fit ? option : chosen));
    return [...plan, top.day];
  }, []);
}

function buildKey(puzzle: WeatherPuzzle, plan: readonly number[]): string {
  return plan.map((day) => puzzle.weather[day]).join(",");
}

export function analysePuzzle(puzzle: WeatherPuzzle): PuzzleAnalysis {
  const known = analyses.get(puzzle);
  if (known) {
    return known;
  }
  const plans = listPlans(puzzle.weather.length, puzzle.trips.length);
  const scored = plans.map((plan) => ({ plan, total: scorePlan(puzzle, plan) }));
  const top = scored.reduce((chosen, option) => (option.total > chosen.total ? option : chosen));
  const topKey = buildKey(puzzle, top.plan);
  const rival = scored
    .filter(({ plan }) => buildKey(puzzle, plan) !== topKey)
    .reduce((highest, { total }) => Math.max(highest, total), -1);
  const sum = scored.reduce((total, option) => total + option.total, 0);
  const analysis = {
    best: top.total,
    rival,
    averageShare: sum / scored.length / top.total,
    greedy: scorePlan(puzzle, planGreedily(puzzle)),
    bestPlan: top.plan,
  };
  analyses.set(puzzle, analysis);
  return analysis;
}
