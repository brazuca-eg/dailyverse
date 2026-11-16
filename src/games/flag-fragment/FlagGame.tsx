import type { GuessingState } from "../../core/guessing";
import { findCountryByCode } from "../../core/search";
import type { Country } from "../../core/types";
import { useTodaysItem } from "../../hooks/useTodaysItem";
import { GuessingGame } from "../../ui/GuessingGame";
import { FlagViewer } from "./FlagViewer";
import { findFlagFact } from "./facts";
import { buildRoundId, resolveRevealStage } from "./game";
import { flagStorage } from "./persistence";
import { FLAG_FRAGMENT_RULE_STEPS } from "./rules";
import type { FlagEntry } from "./types";

interface FlagGameProps {
  schedule: readonly FlagEntry[];
  countries: readonly Country[];
  launchDate: Date;
}

export function FlagGame({ schedule, countries, launchDate }: FlagGameProps) {
  const { dayIndex, item: entry } = useTodaysItem(schedule, launchDate);
  const answer = findCountryByCode(countries, entry.code);
  if (!answer) {
    return <p>Today's flag could not be loaded.</p>;
  }

  function renderFlag(state: GuessingState) {
    return <FlagViewer code={entry.code} focus={entry.focus} stage={resolveRevealStage(state)} />;
  }

  return (
    <GuessingGame
      gameTitle="Flag Fragment"
      storage={flagStorage}
      puzzleId={buildRoundId(entry.code, dayIndex)}
      answer={answer}
      countries={countries}
      dayIndex={dayIndex}
      ruleSteps={FLAG_FRAGMENT_RULE_STEPS}
      renderStage={renderFlag}
      showFlags={false}
      resultFact={findFlagFact(entry.code) ?? undefined}
    />
  );
}
