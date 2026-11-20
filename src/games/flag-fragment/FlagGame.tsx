import type { GuessingState } from "../../core/guessing";
import { findCountryByCode } from "../../core/search";
import type { Country } from "../../core/types";
import { useLocaleData } from "../../hooks/useLocaleData";
import { useTodaysItem } from "../../hooks/useTodaysItem";
import { GuessingGame } from "../../ui/GuessingGame";
import { FlagViewer } from "./FlagViewer";
import { findFlagFact, loadLocalFacts } from "./facts";
import { buildRoundId, resolveRevealStage } from "./game";
import { flagStorage } from "./persistence";
import { flagMessages as t } from "./messages";
import { gameMeta } from "./meta";
import { buildRuleSteps } from "./rules";
import type { FlagEntry } from "./types";

interface FlagGameProps {
  schedule: readonly FlagEntry[];
  countries: readonly Country[];
  launchDate: Date;
}

export function FlagGame({ schedule, countries, launchDate }: FlagGameProps) {
  const { dayIndex, item: entry } = useTodaysItem(schedule, launchDate);
  const localFacts = useLocaleData(loadLocalFacts);
  const answer = findCountryByCode(countries, entry.code);
  if (!answer) {
    return <p>{t("flag.loadError")}</p>;
  }

  function renderFlag(state: GuessingState) {
    return <FlagViewer code={entry.code} focus={entry.focus} stage={resolveRevealStage(state)} />;
  }

  return (
    <GuessingGame
      gameTitle={gameMeta("meta.flag.title")}
      storage={flagStorage}
      puzzleId={buildRoundId(entry.code, dayIndex)}
      answer={answer}
      countries={countries}
      dayIndex={dayIndex}
      ruleSteps={buildRuleSteps()}
      renderStage={renderFlag}
      showFlags={false}
      resultFact={findFlagFact(entry.code, localFacts) ?? undefined}
    />
  );
}
