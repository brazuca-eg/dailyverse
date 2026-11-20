import { MAX_LIVES } from "./game";
import { spotMessages as t } from "./messages";
import "./Lives.css";

interface LivesProps {
  livesLeft: number;
}

export function Lives({ livesLeft }: LivesProps) {
  const label = t("spot.lives.left", { count: livesLeft });
  return (
    <span className="lives" role="img" aria-label={label}>
      {Array.from({ length: MAX_LIVES }, (_, index) => (
        <span
          key={index}
          className={index < livesLeft ? "life" : "life life-lost"}
          aria-hidden="true"
        >
          {index < livesLeft ? "❤️" : "🤍"}
        </span>
      ))}
    </span>
  );
}
