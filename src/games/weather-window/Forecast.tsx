import { DAY_NAMES, TRIPS, WEATHERS, readShortDayName } from "./catalogue";
import { QuestionIcon, TripIcon, WeatherIcon } from "./Icons";
import type { WeatherPuzzle } from "./types";
import { UNPLACED } from "./types";
import "./Forecast.css";

interface ForecastProps {
  puzzle: WeatherPuzzle;
  plan: readonly number[];
  isRevealed: (day: number) => boolean;
  isActive: boolean;
  selectedTrip: number | null;
  isPeekArmed: boolean;
  onTapDay: (day: number) => void;
}

function describeDay(
  puzzle: WeatherPuzzle,
  plan: readonly number[],
  day: number,
  isRevealed: boolean,
): string {
  const trip = plan.indexOf(day);
  const parts = [
    DAY_NAMES[day].label,
    isRevealed ? WEATHERS[puzzle.weather[day]].label : "weather hidden",
    trip === UNPLACED ? "no trip planned" : `${TRIPS[puzzle.trips[trip]].label} planned`,
  ];
  return parts.join(", ");
}

export function Forecast({
  puzzle,
  plan,
  isRevealed,
  isActive,
  selectedTrip,
  isPeekArmed,
  onTapDay,
}: ForecastProps) {
  const hint = isPeekArmed || selectedTrip !== null;
  return (
    <ul className="ww-forecast">
      {puzzle.weather.map((weather, day) => {
        const revealed = isRevealed(day);
        const trip = plan.indexOf(day);
        return (
          <li key={DAY_NAMES[day].id}>
            <button
              type="button"
              className={revealed ? "ww-day ww-day-open" : "ww-day"}
              disabled={!isActive}
              data-targeted={isActive && hint}
              aria-label={describeDay(puzzle, plan, day, revealed)}
              onClick={() => onTapDay(day)}
            >
              <span className="ww-day-name">{readShortDayName(day)}</span>
              <span className="ww-day-weather">
                {revealed ? (
                  <WeatherIcon weather={weather} size={30} />
                ) : (
                  <QuestionIcon size={30} />
                )}
                <span className="ww-day-label">
                  {revealed ? WEATHERS[weather].label : "Hidden"}
                </span>
              </span>
              <span className="ww-day-trip">
                {trip === UNPLACED ? (
                  "—"
                ) : (
                  <>
                    <TripIcon trip={puzzle.trips[trip]} size={16} />
                    {TRIPS[puzzle.trips[trip]].label}
                  </>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
