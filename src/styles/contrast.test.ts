import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateContrast } from "../testing/contrast";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");

function readTokens(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)].map((match) => [match[1], match[2]]),
  );
}

const light = readTokens(css.slice(0, darkStart));
const themes: [string, Record<string, string>][] = [
  ["light", light],
  ["dark", { ...light, ...readTokens(css.slice(darkStart)) }],
];

const TEXT_PAIRS: [string, string][] = [
  ["text", "bg"],
  ["text", "surface"],
  ["text-muted", "bg"],
  ["text-muted", "surface"],
  ["text-muted", "surface-sunken"],
  ["success-text", "bg"],
  ["success-text", "surface"],
  ["success-text", "success-bg"],
  ["danger", "bg"],
  ["danger", "surface"],
  ["on-accent", "accent"],
  ["text", "surface-sunken"],
  ["text", "accent-soft"],
  ["primary", "surface"],
  ["primary", "surface-sunken"],
  ["primary", "accent-soft"],
  ["danger", "accent-soft"],
  ["text-muted", "accent-soft"],
  ["text", "border"],
  ["text", "success-bg"],
  ["text-muted", "success-bg"],
  ["danger", "surface-sunken"],
  ["on-primary", "primary"],
];

const GRAPHIC_PAIRS: [string, string][] = [
  ["cell-edge", "bg"],
  ["primary", "bg"],
  ["cell-edge", "surface"],
  ["success", "surface"],
  ["primary", "accent-soft"],
  ["cell-edge", "surface-sunken"],
  ["primary", "surface-sunken"],
  ["text", "surface-sunken"],
  ["danger", "bg"],
];

describe.each(themes)("design tokens in %s mode", (_name, tokens) => {
  it.each(TEXT_PAIRS)("keeps %s readable on %s (4.5:1)", (foreground, background) => {
    expect(calculateContrast(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(GRAPHIC_PAIRS)("keeps %s visible against %s (3:1)", (foreground, background) => {
    expect(calculateContrast(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(3);
  });
});
