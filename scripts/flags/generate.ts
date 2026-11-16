import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import type { Country } from "../../src/core/types";
import type { FlagEntry } from "../../src/games/flag-fragment/types";
import { resolveFlagDifficulty } from "./difficulty";
import { chooseFocus, type RasterImage } from "./focus";

const RASTER_WIDTH = 160;
const COUNTRIES_PATH = new URL("../../src/core/countries.json", import.meta.url);
const OUTPUT_PATH = new URL("../../src/games/flag-fragment/flags.json", import.meta.url);

function rasteriseFlag(code: string): RasterImage {
  const svgPath = new URL(
    `../../node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`,
    import.meta.url,
  );
  const rendered = new Resvg(readFileSync(svgPath), {
    fitTo: { mode: "width", value: RASTER_WIDTH },
  }).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function buildEntry(country: Country): FlagEntry {
  return {
    code: country.code,
    difficulty: resolveFlagDifficulty(country.code),
    focus: chooseFocus(rasteriseFlag(country.code)),
  };
}

const countries = JSON.parse(readFileSync(COUNTRIES_PATH, "utf8")) as Country[];
writeFileSync(OUTPUT_PATH, JSON.stringify(countries.map(buildEntry)));
