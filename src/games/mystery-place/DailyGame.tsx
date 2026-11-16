import { getFlagEmoji } from "../../core/flags";
import type { GuessingState } from "../../core/guessing";
import type { Country } from "../../core/types";
import { GuessingGame } from "../../ui/GuessingGame";
import { CluesList } from "./CluesList";
import { countVisibleClues } from "./game";
import { mysteryPlaceStorage } from "./persistence";
import { MYSTERY_PLACE_RULE_EXAMPLE, MYSTERY_PLACE_RULE_STEPS } from "./rules";
import type { MysteryPlacePuzzle } from "./types";

interface DailyGameProps {
  puzzle: MysteryPlacePuzzle;
  answer: Country;
  countries: readonly Country[];
  dayIndex: number;
}

export function DailyGame({ puzzle, answer, countries, dayIndex }: DailyGameProps) {
  function renderClues(state: GuessingState) {
    const visibleCount = countVisibleClues(state, puzzle.clues.length);
    return (
      <CluesList
        clues={puzzle.clues}
        visibleCount={visibleCount}
        highlightIndex={state.status === "playing" ? visibleCount - 1 : null}
      />
    );
  }

  return (
    <GuessingGame
      gameTitle="Mystery Place"
      storage={mysteryPlaceStorage}
      puzzleId={puzzle.id}
      answer={answer}
      countries={countries}
      dayIndex={dayIndex}
      ruleSteps={MYSTERY_PLACE_RULE_STEPS}
      ruleExample={MYSTERY_PLACE_RULE_EXAMPLE}
      renderStage={renderClues}
      resultVisual={getFlagEmoji(answer.code)}
      resultFact={puzzle.reveal}
    />
  );
}
