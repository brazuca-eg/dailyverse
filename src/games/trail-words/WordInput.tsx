import { t } from "./messages";
import type { Toast } from "./useTrailSession";
import "./WordInput.css";

interface WordInputProps {
  input: string;
  centre: string;
  letters: string;
  toast: Toast | null;
}

export function WordInput({ input, centre, letters, toast }: WordInputProps) {
  const isRejected = toast?.tone === "bad";

  return (
    <div className="word-input">
      <p className={`toast toast-${toast?.tone ?? "none"}`} role="status" key={toast?.id ?? 0}>
        {toast?.text}
      </p>
      <p
        className={isRejected ? "typed typed-shake" : "typed"}
        aria-label={input === "" ? t("words.input.empty") : t("words.input.word", { word: input })}
        key={`typed-${isRejected ? toast.id : 0}`}
      >
        {[...input].map((letter, index) => (
          <span
            key={index}
            className={
              letter === centre
                ? "typed-letter typed-centre"
                : letters.includes(letter)
                  ? "typed-letter"
                  : "typed-letter typed-bad"
            }
          >
            {letter}
          </span>
        ))}
        <span className="typed-caret" aria-hidden="true" />
      </p>
    </div>
  );
}
