import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryStore } from "../core/testing";
import {
  DARK_THEME_COLOUR,
  LIGHT_THEME_COLOUR,
  THEME_INIT_SCRIPT,
  THEME_KEY,
  applyThemeChoice,
  isDarkResolved,
  readThemeChoice,
  saveThemeChoice,
} from "./theme";

function mockSystem(prefersDark: boolean) {
  window.matchMedia = (() => ({ matches: prefersDark })) as unknown as typeof window.matchMedia;
}

function readColour(): string | null {
  return document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? null;
}

describe("theme choice storage", () => {
  it("defaults to the system theme", () => {
    expect(readThemeChoice(createMemoryStore())).toBe("system");
  });

  it("saves a choice and reads it back", () => {
    const store = createMemoryStore();
    (["light", "dark", "system"] as const).forEach((choice) => {
      expect(saveThemeChoice(choice, store)).toBe(true);
      expect(readThemeChoice(store)).toBe(choice);
    });
  });

  it("ignores a stored value that is not a theme", () => {
    expect(readThemeChoice(createMemoryStore({ [THEME_KEY]: '"purple"' }))).toBe("system");
    expect(readThemeChoice(createMemoryStore({ [THEME_KEY]: "not json" }))).toBe("system");
  });
});

describe("isDarkResolved", () => {
  it("follows the system only for the system choice", () => {
    expect(isDarkResolved("system", true)).toBe(true);
    expect(isDarkResolved("system", false)).toBe(false);
    expect(isDarkResolved("light", true)).toBe(false);
    expect(isDarkResolved("dark", false)).toBe(true);
  });
});

describe("applyThemeChoice", () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000">';
    document.documentElement.removeAttribute("data-theme");
  });

  it("marks the page with a chosen theme and clears the mark for the system theme", () => {
    mockSystem(false);
    applyThemeChoice("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    applyThemeChoice("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    applyThemeChoice("system");
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("sets the browser colour to match the theme that shows", () => {
    mockSystem(true);
    applyThemeChoice("light");
    expect(readColour()).toBe(LIGHT_THEME_COLOUR);
    applyThemeChoice("system");
    expect(readColour()).toBe(DARK_THEME_COLOUR);
    mockSystem(false);
    applyThemeChoice("system");
    expect(readColour()).toBe(LIGHT_THEME_COLOUR);
    applyThemeChoice("dark");
    expect(readColour()).toBe(DARK_THEME_COLOUR);
  });
});

describe("THEME_INIT_SCRIPT", () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000">';
    document.documentElement.removeAttribute("data-theme");
    mockSystem(false);
  });

  function run() {
    new Function(THEME_INIT_SCRIPT)();
  }

  it("applies a saved dark or light choice before the page shows", () => {
    localStorage.setItem(THEME_KEY, '"dark"');
    run();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(readColour()).toBe(DARK_THEME_COLOUR);
    localStorage.setItem(THEME_KEY, '"light"');
    run();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(readColour()).toBe(LIGHT_THEME_COLOUR);
  });

  it("leaves the system theme to the browser", () => {
    localStorage.setItem(THEME_KEY, '"system"');
    run();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(readColour()).toBe(LIGHT_THEME_COLOUR);
  });

  it("matches what applyThemeChoice does", () => {
    (["light", "dark", "system"] as const).forEach((choice) => {
      document.documentElement.removeAttribute("data-theme");
      applyThemeChoice(choice);
      const applied = [document.documentElement.getAttribute("data-theme"), readColour()];
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(THEME_KEY, JSON.stringify(choice));
      run();
      expect([document.documentElement.getAttribute("data-theme"), readColour()]).toEqual(applied);
    });
  });

  it("does not fail when nothing is saved or the value is broken", () => {
    run();
    localStorage.setItem(THEME_KEY, "{");
    expect(run).not.toThrow();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });
});
