import {
  calculateProximityPercent,
  COMPASS_DIRECTIONS,
  type CompassDirection,
} from "../core/distance";
import { getFlagEmoji } from "../core/flags";
import { ArrowUpIcon } from "./icons";
import "./GuessRow.css";

interface GuessRowProps {
  countryCode: string;
  name: string;
  distanceKm: number;
  direction: CompassDirection;
  showFlag?: boolean;
}

const DIRECTION_LABELS: Record<CompassDirection, string> = {
  N: "north",
  NE: "north-east",
  E: "east",
  SE: "south-east",
  S: "south",
  SW: "south-west",
  W: "west",
  NW: "north-west",
};

const NEAR_PROXIMITY_PERCENT = 75;
const MID_PROXIMITY_PERCENT = 40;
const MIN_BAR_WIDTH_PERCENT = 4;

function resolveProximityClass(proximity: number): string {
  if (proximity >= NEAR_PROXIMITY_PERCENT) {
    return "proximity-near";
  }
  if (proximity >= MID_PROXIMITY_PERCENT) {
    return "proximity-mid";
  }
  return "proximity-far";
}

export function GuessRow({
  countryCode,
  name,
  distanceKm,
  direction,
  showFlag = true,
}: GuessRowProps) {
  const proximity = calculateProximityPercent(distanceKm);
  const directionLabel = DIRECTION_LABELS[direction];
  const rotation = COMPASS_DIRECTIONS.indexOf(direction) * 45;
  return (
    <>
      {showFlag && (
        <span className="guess-flag" aria-hidden="true">
          {getFlagEmoji(countryCode)}
        </span>
      )}
      <div className="guess-main">
        <div className="guess-line">
          <span className="guess-name">{name}</span>
          <span className="guess-distance">{distanceKm.toLocaleString("en-US")} km</span>
        </div>
        <div className="proximity">
          <div className="proximity-track">
            <div
              className={`proximity-fill ${resolveProximityClass(proximity)}`}
              style={{ width: `${Math.max(proximity, MIN_BAR_WIDTH_PERCENT)}%` }}
            />
          </div>
          <span className="proximity-value">{proximity}%</span>
        </div>
      </div>
      <span
        className="guess-badge"
        role="img"
        aria-label={`Target is ${directionLabel}`}
        title={`Target is ${directionLabel}`}
      >
        <span style={{ display: "inline-flex", transform: `rotate(${rotation}deg)` }}>
          <ArrowUpIcon size={22} />
        </span>
      </span>
    </>
  );
}
