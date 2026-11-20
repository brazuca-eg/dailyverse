import {
  calculateProximityPercent,
  COMPASS_DIRECTIONS,
  type CompassDirection,
} from "../core/distance";
import { getFlagEmoji } from "../core/flags";
import { coreMessages } from "../core/messages";
import { readCurrentLocale } from "../i18n/locales";
import { ArrowUpIcon } from "./icons";
import { uiMessages as t } from "./messages";
import "./GuessRow.css";

interface GuessRowProps {
  countryCode: string;
  name: string;
  distanceKm: number;
  direction: CompassDirection;
  showFlag?: boolean;
}

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
  const targetLabel = t("ui.guess.target", {
    direction: coreMessages(`core.direction.${direction}`),
  });
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
          <span className="guess-distance">
            {t("ui.guess.distance", { distance: distanceKm.toLocaleString(readCurrentLocale()) })}
          </span>
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
      <span className="guess-badge" role="img" aria-label={targetLabel} title={targetLabel}>
        <span style={{ display: "inline-flex", transform: `rotate(${rotation}deg)` }}>
          <ArrowUpIcon size={22} />
        </span>
      </span>
    </>
  );
}
