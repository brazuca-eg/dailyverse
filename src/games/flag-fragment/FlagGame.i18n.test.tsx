import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { countries } from "../../core/countries";
import { FlagGame } from "./FlagGame";
import type { FlagEntry } from "./types";

const LAUNCH_DATE = new Date("2026-11-16T00:00:00Z");
const schedule: FlagEntry[] = [{ code: "PT", difficulty: "medium", focus: { x: 0.3, y: 0.5 } }];

afterEach(() => {
  document.documentElement.lang = "";
});

describe("Flag Fragment in German", () => {
  it("translates the viewer label and the rules", () => {
    document.documentElement.lang = "de";
    render(<FlagGame schedule={schedule} countries={countries} launchDate={LAUNCH_DATE} />);
    expect(
      screen.getByRole("img", { name: "Geheime Flagge, Ansicht 1 von 5" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nenne das Land anhand eines kleinen Ausschnitts/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/flag\.\w+\.\w+/);
  });
});
