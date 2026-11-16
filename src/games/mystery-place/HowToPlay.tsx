import { GuessRow } from "./GuessRow";
import { MAX_GUESSES } from "./game";
import "./HowToPlay.css";

interface HowToPlayProps {
  onStart: () => void;
}

export function HowToPlay({ onStart }: HowToPlayProps) {
  return (
    <div className="how-to-play">
      <ol className="steps">
        <li>Find the mystery country. You have {MAX_GUESSES} guesses.</li>
        <li>Each wrong guess unlocks another clue.</li>
        <li>
          After a guess, the arrow points from your guess toward the answer, and the bar shows how
          close you are.
        </li>
        <li>The fewer guesses you use, the more points you earn.</li>
      </ol>
      <div className="guess example" aria-hidden="true">
        <GuessRow countryCode="ES" name="Spain" distanceKm={1420} direction="NE" />
      </div>
      <p className="how-to-play-note">A new puzzle arrives every day at 00:00 UTC.</p>
      <button type="button" className="button button-primary button-block" onClick={onStart}>
        Start playing
      </button>
    </div>
  );
}
