import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WordInput } from "./WordInput";

function renderInput(
  input: string,
  toast = null as null | { id: number; text: string; tone: "good" | "pangram" | "bad" },
) {
  return render(<WordInput input={input} centre="m" letters="macegly" toast={toast} />);
}

describe("WordInput", () => {
  it("says when the word is empty", () => {
    renderInput("");
    expect(screen.getByLabelText("Your word is empty")).toBeInTheDocument();
  });

  it("shows the typed word for screen readers", () => {
    renderInput("came");
    expect(screen.getByLabelText("Your word: came")).toHaveTextContent("came");
  });

  it("marks the centre letter and letters that are not on the board", () => {
    renderInput("cmz");
    expect(screen.getByText("c")).toHaveClass("typed-letter");
    expect(screen.getByText("c")).not.toHaveClass("typed-centre");
    expect(screen.getByText("m")).toHaveClass("typed-centre");
    expect(screen.getByText("z")).toHaveClass("typed-bad");
  });

  it("announces a message in a status region, in its tone", () => {
    renderInput("", { id: 1, text: "+3", tone: "good" });
    expect(screen.getByRole("status")).toHaveTextContent("+3");
    expect(screen.getByRole("status")).toHaveClass("toast-good");
  });

  it("shakes the word when it was rejected, and not when it was accepted", () => {
    const rejected = renderInput("zzzz", { id: 1, text: "Bad letters", tone: "bad" });
    expect(screen.getByLabelText("Your word: zzzz")).toHaveClass("typed-shake");
    rejected.unmount();
    renderInput("", { id: 2, text: "+1", tone: "good" });
    expect(screen.getByLabelText("Your word is empty")).not.toHaveClass("typed-shake");
  });

  it("has an empty status region when there is no message", () => {
    renderInput("");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
