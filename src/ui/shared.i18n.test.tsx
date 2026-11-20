import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { countries } from "../core/countries";
import type { GuessRecord } from "../core/guessing";
import { GameToolbar } from "./GameToolbar";
import { GuessHistory } from "./GuessHistory";
import { GuessInput } from "./GuessInput";
import { ProgressPips } from "./ProgressPips";
import { ResultPanel } from "./ResultPanel";
import { StatsSummary } from "./StatsSummary";
import { AnswerSummary } from "./AnswerSummary";

const wrongGuess: GuessRecord = {
  countryCode: "PE",
  feedback: { isCorrect: false, distanceKm: 12087, direction: "NE" },
};
const egypt = countries.find((country) => country.code === "EG");

function expectNoRawKeys() {
  expect(document.body.textContent).not.toMatch(/\bui\.[a-z]+\./);
  expect(document.body.textContent).not.toMatch(/\bcore\.[a-z]+\./);
}

afterEach(() => {
  document.documentElement.lang = "";
});

describe("shared UI in German", () => {
  it("translates the guess history, with the country name and direction", () => {
    document.documentElement.lang = "de";
    render(<GuessHistory guesses={[wrongGuess]} countries={countries} />);
    const row = screen.getByRole("listitem");
    expect(within(row).getByText("Peru")).toBeInTheDocument();
    expect(within(row).getByText("12.087 km")).toBeInTheDocument();
    expect(
      within(row).getByRole("img", { name: "Das Ziel liegt im Nordosten" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Deine Tipps" })).toBeInTheDocument();
    expectNoRawKeys();
  });

  it("shows a stored guess in the language the page has now", () => {
    document.documentElement.lang = "de";
    render(
      <GuessHistory
        guesses={[{ countryCode: "DE", feedback: { isCorrect: true } }]}
        countries={countries}
      />,
    );
    expect(screen.getByText("Deutschland")).toBeInTheDocument();
    expect(screen.getByText("Richtig")).toBeInTheDocument();
  });

  it("lets the player type a German country name and shows German suggestions", async () => {
    document.documentElement.lang = "de";
    const user = userEvent.setup();
    render(<GuessInput countries={countries} excludedCodes={[]} onSubmitGuess={() => {}} />);
    const input = screen.getByRole("combobox", { name: "Rate ein Land" });
    expect(input).toHaveAttribute("placeholder", "Land eingeben");
    await user.type(input, "Deutsch");
    expect(screen.getByRole("option")).toHaveTextContent("Deutschland");
    expect(screen.getByRole("button", { name: "Raten" })).toBeInTheDocument();
    expectNoRawKeys();
  });

  it("explains an empty guess in German", async () => {
    document.documentElement.lang = "de";
    const user = userEvent.setup();
    render(<GuessInput countries={countries} excludedCodes={[]} onSubmitGuess={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Raten" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Gib ein Land zum Raten ein.");
  });

  it("translates the progress label, toolbar and stats", () => {
    document.documentElement.lang = "de";
    render(
      <>
        <ProgressPips
          guessCount={1}
          status="playing"
          actions={<GameToolbar onShowHelp={() => {}} onShowStats={() => {}} />}
        />
        <StatsSummary
          stats={{
            gamesPlayed: 3,
            gamesWon: 2,
            currentStreak: 1,
            maxStreak: 2,
            lastCompletedDay: null,
          }}
          todayDayIndex={5}
        />
      </>,
    );
    expect(screen.getAllByText("Tipp 2 von 5").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "So wird gespielt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deine Statistik" })).toBeInTheDocument();
    expect(screen.getByText("Siegquote")).toBeInTheDocument();
    expectNoRawKeys();
  });

  it("translates the result panel and the answer", () => {
    document.documentElement.lang = "de";
    render(
      <ResultPanel
        status="won"
        score={4}
        maxScore={5}
        summary={egypt ? <AnswerSummary answer={egypt} /> : null}
        shareText="Dailyverse"
      />,
    );
    expect(screen.getByRole("heading", { name: "Geschafft!" })).toBeInTheDocument();
    expect(screen.getByText("Die Antwort war", { exact: false })).toHaveTextContent("Ägypten");
    expect(screen.getByText("4 / 5 Punkte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ergebnis teilen" })).toBeInTheDocument();
    expect(screen.getByText("Nächstes Rätsel in")).toBeInTheDocument();
    expectNoRawKeys();
  });

  it("translates the lost result in Ukrainian", () => {
    document.documentElement.lang = "uk";
    render(<ResultPanel status="lost" score={0} maxScore={5} summary="x" shareText="Dailyverse" />);
    expect(screen.getByText("Спроби закінчилися")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Цього разу ні" })).toBeInTheDocument();
    expectNoRawKeys();
  });
});
