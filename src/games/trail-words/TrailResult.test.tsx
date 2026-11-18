import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { commonWords, findWinningWords, pangram, plainWord, puzzle } from "./fixtures";
import { TrailResult } from "./TrailResult";

function renderResult(status: "playing" | "won" | "lost", found: string[], ended: boolean) {
  return render(
    <TrailResult
      puzzle={puzzle}
      found={found}
      status={status}
      ended={ended}
      shareText="SHARE TEXT"
    />,
  );
}

describe("TrailResult", () => {
  it("shows nothing while playing", () => {
    const { container } = renderResult("playing", [], false);
    expect(container).toBeEmptyDOMElement();
  });

  it("congratulates a win with the rank reached, and offers to share", () => {
    renderResult("won", findWinningWords(), false);
    expect(screen.getByText("You reached Ranger")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Well climbed!" })).toBeInTheDocument();
    expect(screen.getByText("SHARE TEXT")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
  });

  it("does not list the missed words while the game is still going", () => {
    renderResult("won", findWinningWords(), false);
    expect(screen.queryByText(/Words you missed/)).not.toBeInTheDocument();
  });

  it("lists the missed words after the game has ended, with the pangram marked", () => {
    renderResult("lost", [plainWord], true);
    const missed = puzzle.words.length - 1;
    expect(screen.getByText("Game ended")).toBeInTheDocument();
    expect(screen.getByText(`Words you missed (${missed})`)).toBeInTheDocument();
    expect(screen.queryByText(plainWord, { selector: "li" })).not.toBeInTheDocument();
    expect(screen.getByText(pangram)).toHaveClass("trail-pangram");
  });

  it("has no missed list when everything was found", () => {
    renderResult("won", puzzle.words as string[], true);
    expect(screen.queryByText(/Words you missed/)).not.toBeInTheDocument();
    expect(commonWords.length).toBeGreaterThan(0);
  });
});
