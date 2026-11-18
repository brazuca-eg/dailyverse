import { DAY_NAMES, TRIPS, WEATHERS, readFit } from "./catalogue";
import { analysePuzzle } from "./solver";
import type { WeatherPuzzle } from "./types";
import "./Review.css";

interface ReviewProps {
  puzzle: WeatherPuzzle;
  plan: readonly number[];
}

function describePick(puzzle: WeatherPuzzle, trip: number, day: number): string {
  const weather = puzzle.weather[day];
  const points = readFit(puzzle.trips[trip], weather);
  return `${DAY_NAMES[day].label}, ${WEATHERS[weather].label}, ${points} ${points === 1 ? "point" : "points"}`;
}

export function Review({ puzzle, plan }: ReviewProps) {
  const { bestPlan } = analysePuzzle(puzzle);
  return (
    <section className="ww-review" aria-label="Your plan and the best plan">
      <ul className="ww-review-list">
        {puzzle.trips.map((trip, index) => (
          <li key={TRIPS[trip].id} className="ww-review-row">
            <strong>{TRIPS[trip].label}</strong>
            <span>You: {describePick(puzzle, index, plan[index])}</span>
            <span>
              {puzzle.weather[plan[index]] === puzzle.weather[bestPlan[index]]
                ? "Best: you matched it"
                : `Best: ${describePick(puzzle, index, bestPlan[index])}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
