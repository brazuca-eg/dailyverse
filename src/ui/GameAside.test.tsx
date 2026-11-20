import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyStats } from "../core/streak";
import { GameAside } from "./GameAside";
import { GameDialogs } from "./GameDialogs";

const steps = ["First rule", "Second rule"];
const stats = { ...createEmptyStats(), gamesPlayed: 4, gamesWon: 3, maxStreak: 2 };

describe("GameAside", () => {
  it("lists the rules in order and the stats of the game", () => {
    render(<GameAside ruleSteps={steps} stats={stats} dayIndex={5} />);
    const rules = screen.getByRole("list");
    expect(
      within(rules)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(steps);
    expect(screen.getByRole("heading", { name: "How to play" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Your stats" })).toBeVisible();
    expect(screen.getByText("Played").nextElementSibling).toHaveTextContent("4");
    expect(screen.getByText("Win rate").nextElementSibling).toHaveTextContent("75%");
  });

  it("shows the example when there is one", () => {
    render(
      <GameAside
        ruleSteps={steps}
        ruleExample={<span>Example row</span>}
        stats={stats}
        dayIndex={5}
      />,
    );
    expect(screen.getByText("Example row")).toBeInTheDocument();
  });

  it("is written in the page language", () => {
    document.documentElement.lang = "de";
    render(<GameAside ruleSteps={steps} stats={stats} dayIndex={5} />);
    expect(screen.getByRole("heading", { name: "So wird gespielt" })).toBeVisible();
    document.documentElement.lang = "";
  });
});

describe("GameDialogs side panel", () => {
  afterEach(() => {
    document.getElementById("game-aside-slot")?.remove();
  });

  const helpDialog = { isOpen: false, open: () => undefined, close: () => undefined };

  function renderDialogs() {
    return render(
      <GameDialogs
        helpDialog={helpDialog}
        isStatsOpen={false}
        onCloseStats={() => undefined}
        ruleSteps={steps}
        stats={stats}
        dayIndex={5}
      />,
    );
  }

  it("puts the rules and stats into the page's side slot when there is one", () => {
    const slot = document.createElement("div");
    slot.id = "game-aside-slot";
    document.body.appendChild(slot);
    renderDialogs();
    expect(within(slot).getByText("First rule")).toBeInTheDocument();
    expect(within(slot).getByRole("heading", { name: "Your stats" })).toBeInTheDocument();
  });

  it("shows nothing extra when the page has no side slot", () => {
    const { container } = renderDialogs();
    expect(container.querySelector(".aside-card")).toBeNull();
    expect(document.querySelector(".aside-card")).toBeNull();
  });
});
