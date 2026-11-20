import { describe, expect, it } from "vitest";
import { calculateContrast } from "../../testing/contrast";
import { MARKER_COLOURS } from "./markerColours";
import { PALETTES, listSkyBands, tintColour } from "./palettes";
import { MOODS, THEMES } from "./types";

describe("MARKER_COLOURS", () => {
  const backgrounds = THEMES.flatMap((theme) =>
    MOODS.flatMap((mood) => [
      ...listSkyBands(theme, mood).map((sky, index) => [`${theme} ${mood} sky ${index}`, sky]),
      [`${theme} ${mood} ground`, tintColour(PALETTES[theme].ground, mood)],
    ]),
  );

  function readBestContrast(marker: string, background: string): number {
    return Math.max(
      calculateContrast(marker, background),
      calculateContrast(MARKER_COLOURS.halo, background),
    );
  }

  it.each(backgrounds)("keeps the found circle visible on the %s", (_name, background) => {
    expect(readBestContrast(MARKER_COLOURS.found, background)).toBeGreaterThanOrEqual(3);
  });

  it.each(backgrounds)(
    "keeps the missed circle and the wrong-tap cross visible on the %s",
    (_name, background) => {
      expect(readBestContrast(MARKER_COLOURS.missed, background)).toBeGreaterThanOrEqual(3);
    },
  );

  it("uses a white halo, which stands out from both marker colours", () => {
    expect(MARKER_COLOURS.halo).toBe("#ffffff");
    expect(calculateContrast(MARKER_COLOURS.halo, MARKER_COLOURS.found)).toBeGreaterThan(3);
    expect(calculateContrast(MARKER_COLOURS.halo, MARKER_COLOURS.missed)).toBeGreaterThan(3);
  });
});
