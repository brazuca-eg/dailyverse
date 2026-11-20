import type { CSSProperties } from "react";
import {
  DAY_NAMES,
  readDayName,
  readShortDayName,
  readTripLabel,
  readWeatherLabel,
} from "./catalogue";
import { QuestionIcon, TripIcon, WeatherIcon } from "./Icons";
import { t } from "./messages";
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
    readDayName(day),
    isRevealed ? readWeatherLabel(puzzle.weather[day]) : t("weather.forecast.weatherHidden"),
    trip === UNPLACED
      ? t("weather.forecast.noTrip")
      : t("weather.forecast.tripPlanned", { trip: readTripLabel(puzzle.trips[trip]) }),
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
    <ul
      className="ww-forecast"
      style={
        {
          "--ww-days": puzzle.weather.length,
          "--ww-narrow-columns": Math.min(
            puzzle.weather.length,
            4 + Number(puzzle.weather.length <= 5),
          ),
        } as CSSProperties
      }
    >
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
                <span className={revealed ? "ww-day-label" : "ww-day-label visually-hidden"}>
                  {revealed ? readWeatherLabel(weather) : t("weather.forecast.hidden")}
                </span>
              </span>
              <span className="ww-day-trip">
                {trip === UNPLACED ? (
                  "—"
                ) : (
                  <>
                    <TripIcon trip={puzzle.trips[trip]} size={16} />
                    {readTripLabel(puzzle.trips[trip])}
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
