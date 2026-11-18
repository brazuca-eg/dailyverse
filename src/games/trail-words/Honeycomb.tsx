import "./Honeycomb.css";

interface HoneycombProps {
  centre: string;
  outer: readonly string[];
  disabled?: boolean;
  onLetter: (letter: string) => void;
}

const OUTER_POSITIONS = ["top", "upper-right", "lower-right", "bottom", "lower-left", "upper-left"];

export function Honeycomb({ centre, outer, disabled = false, onLetter }: HoneycombProps) {
  return (
    <div className="honeycomb" role="group" aria-label="Letters">
      {outer.map((letter, index) => (
        <button
          key={letter}
          type="button"
          className={`hex hex-${OUTER_POSITIONS[index]}`}
          disabled={disabled}
          aria-label={letter}
          onClick={() => onLetter(letter)}
        >
          <span aria-hidden="true">{letter}</span>
        </button>
      ))}
      <button
        type="button"
        className="hex hex-centre"
        disabled={disabled}
        aria-label={`${centre}, centre letter`}
        onClick={() => onLetter(centre)}
      >
        <span aria-hidden="true">{centre}</span>
      </button>
    </div>
  );
}
