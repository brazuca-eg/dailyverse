import { MAX_LIVES } from "./game";
import "./Lives.css";

interface LivesProps {
  livesLeft: number;
}

export function Lives({ livesLeft }: LivesProps) {
  const label = livesLeft === 1 ? "1 life left" : `${livesLeft} lives left`;
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
