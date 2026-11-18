import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { parseWordList } from "./words";
import { readRealWordList } from "./testing";

const loadWordList = vi.fn();

vi.mock("./wordList", () => ({ loadWordList: () => loadWordList() }));

import { TrailWordsGame } from "./TrailWordsGame";

describe("TrailWordsGame when the word list cannot be loaded", () => {
  it("says so and offers to try again, which then works", async () => {
    loadWordList.mockRejectedValueOnce(new Error("offline"));
    loadWordList.mockResolvedValueOnce(parseWordList(readRealWordList().words.join("\n")));
    render(<TrailWordsGame />);
    expect(await screen.findByText("The word list could not be loaded.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: "Shuffle" })).toBeInTheDocument();
    expect(screen.queryByText("The word list could not be loaded.")).not.toBeInTheDocument();
  });
});
