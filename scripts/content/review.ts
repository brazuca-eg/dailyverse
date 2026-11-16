import type { Country } from "../../src/core/types";
import type { DraftPuzzle, Issue } from "./types";

function formatIssues(issues: readonly Issue[]): string[] {
  if (issues.length === 0) {
    return ["All automatic checks passed."];
  }
  return issues.map(
    (issue) => `- ${issue.severity.toUpperCase()} (${issue.puzzle}): ${issue.message}`,
  );
}

export function buildReviewSheet(
  drafts: readonly DraftPuzzle[],
  countries: readonly Country[],
  issues: readonly Issue[],
  skipped: readonly string[] = [],
): string {
  const namesByCode = new Map(countries.map((country) => [country.code, country.name]));
  const lines: string[] = ["# Mystery Place: batch review", "", "## Automatic checks", ""];
  lines.push(...formatIssues(issues), "");
  if (skipped.length > 0) {
    lines.push(
      "## Countries the model could not draft",
      "",
      ...skipped.map((entry) => `- ${entry}`),
      "",
    );
  }
  for (const draft of drafts) {
    lines.push(`## ${namesByCode.get(draft.country) ?? draft.country} (${draft.difficulty})`, "");
    draft.clues.forEach((clue, index) => {
      lines.push(`${index + 1}. [${clue.kind}] ${clue.text}`);
      lines.push(`   - Source (${clue.evidence.page}): "${clue.evidence.quote}"`);
    });
    lines.push("");
    lines.push(`Fun fact: ${draft.reveal.funFact}`);
    lines.push(`- Source (${draft.reveal.evidence.page}): "${draft.reveal.evidence.quote}"`);
    lines.push(`- Link: ${draft.reveal.sourceUrl}`, "");
  }
  lines.push(
    "## What the checks cannot do",
    "",
    "They confirm each quote exists in the article and that numbers match it. They cannot tell whether a clue reads the quote correctly, whether a puzzle is fair, or whether its difficulty label is right. Please read each clue next to its quote.",
    "",
  );
  return lines.join("\n");
}
