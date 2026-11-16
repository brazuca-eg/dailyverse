import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { requireCountry } from "../core/testing";
import { ResultPanel } from "./ResultPanel";

const answer = requireCountry("EG");
const reveal = {
  funFact: "Egypt is home to the only surviving ancient wonder.",
  sourceUrl: "https://en.wikipedia.org/wiki/Egypt",
};
const shareText = "Dailyverse Mystery Place #2 2/5\n↗️ 🟩";

function renderPanel(status: "playing" | "won" | "lost", score = 0) {
  return render(
    <ResultPanel
      status={status}
      score={score}
      answer={answer}
      visual="🇪🇬"
      fact={reveal}
      shareText={shareText}
    />,
  );
}

describe("ResultPanel", () => {
  it("shows nothing while the game is still being played", () => {
    const { container } = renderPanel("playing");
    expect(container).toBeEmptyDOMElement();
  });

  it("celebrates a win with the answer, the score and confetti", () => {
    const { container } = renderPanel("won", 4);
    expect(screen.getByRole("heading", { name: "You got it!" })).toBeInTheDocument();
    expect(screen.getByText("Egypt")).toBeInTheDocument();
    expect(screen.getByText("4 / 5 points")).toBeInTheDocument();
    expect(container.querySelectorAll(".star-on")).toHaveLength(4);
    expect(container.querySelector(".confetti")).toBeInTheDocument();
  });

  it("is gentler about a loss: no confetti and no points", () => {
    const { container } = renderPanel("lost", 0);
    expect(screen.getByRole("heading", { name: "Not this time" })).toBeInTheDocument();
    expect(screen.getByText("Egypt")).toBeInTheDocument();
    expect(screen.getByText("0 / 5 points")).toBeInTheDocument();
    expect(container.querySelector(".confetti")).not.toBeInTheDocument();
  });

  it("shows the fun fact with a safe external link to its source", () => {
    renderPanel("won", 4);
    expect(screen.getByText(reveal.funFact)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Source/ });
    expect(link).toHaveAttribute("href", reveal.sourceUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows the share text with a share button and the countdown to the next puzzle", () => {
    renderPanel("won", 4);
    expect(screen.getByText(/Dailyverse Mystery Place #2 2\/5/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });
});
