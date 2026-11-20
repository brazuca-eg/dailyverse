import { TRIPS, readDayName, readFit, readTripLabel, readWeatherLabel } from "./catalogue";
import { t } from "./messages";
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
  return [
    readDayName(day),
    readWeatherLabel(weather),
    t("weather.review.points", { count: points }),
  ].join(", ");
}

export function Review({ puzzle, plan }: ReviewProps) {
  const { bestPlan } = analysePuzzle(puzzle);
  return (
    <section className="ww-review" aria-label={t("weather.review.label")}>
      <ul className="ww-review-list">
        {puzzle.trips.map((trip, index) => (
          <li key={TRIPS[trip].id} className="ww-review-row">
            <strong>{readTripLabel(trip)}</strong>
            <span>
              {t("weather.review.you", { pick: describePick(puzzle, index, plan[index]) })}
            </span>
            <span>
              {puzzle.weather[plan[index]] === puzzle.weather[bestPlan[index]]
                ? t("weather.review.matched")
                : t("weather.review.best", { pick: describePick(puzzle, index, bestPlan[index]) })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
