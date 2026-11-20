import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countries } from "../../core/countries";
import { FlagGame } from "./FlagGame";
import { findFlagFact, loadLocalFacts } from "./facts";
import { flagStorage } from "./persistence";
import type { FlagEntry } from "./types";

const LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");
const entry: FlagEntry = { code: "PT", difficulty: "medium", focus: { x: 0.3, y: 0.5 } };

describe("FlagGame fun fact in another language", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    flagStorage.markHelpSeen();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.lang = "";
  });

  async function winGame() {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FlagGame schedule={[entry]} countries={countries} launchDate={LAUNCH_DATE} />);
    await user.type(screen.getByRole("combobox"), "Portugal{Enter}");
    await user.keyboard("{Enter}");
  }

  it("shows the German fact after the game", async () => {
    document.documentElement.lang = "de";
    const local = await loadLocalFacts("de");
    await winGame();
    await waitFor(() => {
      expect(screen.getByText(local?.PT.funFact ?? "missing")).toBeInTheDocument();
    });
    expect(screen.queryByText(findFlagFact("PT")?.funFact ?? "missing")).toBeNull();
  });

  it("shows the English fact in English", async () => {
    await winGame();
    expect(screen.getByText(findFlagFact("PT")?.funFact ?? "missing")).toBeInTheDocument();
  });
});
