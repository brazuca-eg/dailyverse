import { TRIPS, readShortDayName, readTripLabel } from "./catalogue";
import { TripIcon } from "./Icons";
import { t } from "./messages";
import type { WeatherPuzzle } from "./types";
import { UNPLACED } from "./types";
import "./Trips.css";

interface TripsProps {
  puzzle: WeatherPuzzle;
  plan: readonly number[];
  selectedTrip: number | null;
  isActive: boolean;
  onSelect: (trip: number) => void;
}

export function Trips({ puzzle, plan, selectedTrip, isActive, onSelect }: TripsProps) {
  return (
    <ul className="ww-trips">
      {puzzle.trips.map((trip, index) => (
        <li key={TRIPS[trip].id}>
          <button
            type="button"
            className="ww-trip"
            disabled={!isActive}
            aria-pressed={selectedTrip === index}
            onClick={() => onSelect(index)}
          >
            <TripIcon trip={trip} size={26} />
            <span className="ww-trip-name">{readTripLabel(trip)}</span>
            <span className="ww-trip-day">
              {plan[index] === UNPLACED
                ? t("weather.trips.notPlanned")
                : readShortDayName(plan[index])}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
