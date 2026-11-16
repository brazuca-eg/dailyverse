import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressPips } from "./ProgressPips";

function pipClasses(label: string): string[] {
  return Array.from(screen.getByRole("img", { name: label }).children).map(
    (pip) => pip.className.replace("pip", "").trim() || "empty",
  );
}

describe("ProgressPips", () => {
  it("marks the guess being made at the start", () => {
    render(<ProgressPips guessCount={0} status="playing" />);
    expect(screen.getAllByText("Guess 1 of 5").length).toBeGreaterThan(0);
    expect(pipClasses("Guess 1 of 5")).toEqual(["pip-current", "empty", "empty", "empty", "empty"]);
  });

  it("fills a pip for each guess made", () => {
    render(<ProgressPips guessCount={2} status="playing" />);
    expect(pipClasses("Guess 3 of 5")).toEqual([
      "pip-used",
      "pip-used",
      "pip-current",
      "empty",
      "empty",
    ]);
  });

  it("marks the winning guess and drops the current marker", () => {
    render(<ProgressPips guessCount={2} status="won" />);
    expect(screen.getAllByText("2 of 5 guesses used").length).toBeGreaterThan(0);
    expect(pipClasses("2 of 5 guesses used")).toEqual([
      "pip-used",
      "pip-win",
      "empty",
      "empty",
      "empty",
    ]);
  });

  it("shows every pip as used after a loss", () => {
    render(<ProgressPips guessCount={5} status="lost" />);
    expect(pipClasses("5 of 5 guesses used")).toEqual(Array(5).fill("pip-used"));
  });

  it("shows the actions next to the label", () => {
    render(<ProgressPips guessCount={0} status="playing" actions={<button>Extra</button>} />);
    expect(screen.getByRole("button", { name: "Extra" })).toBeInTheDocument();
  });
});
