import { isOneOf } from "../core/guards";
import { findStoredValue, saveStoredValue, type KeyValueStore } from "../core/storage";

export const THEME_KEY = "dailyverse:theme";
export const THEME_CHOICES = ["system", "light", "dark"] as const;
export const LIGHT_THEME_COLOUR = "#2a7a58";
export const DARK_THEME_COLOUR = "#1e4a3a";

export type ThemeChoice = (typeof THEME_CHOICES)[number];

export const THEME_INIT_SCRIPT = `(function(){try{var c=JSON.parse(localStorage.getItem("${THEME_KEY}"));var d=document.documentElement;if(c==="light"||c==="dark"){d.setAttribute("data-theme",c)}var m=document.querySelector('meta[name="theme-color"]');var dark=c==="dark"||(c!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(m){m.setAttribute("content",dark?"${DARK_THEME_COLOUR}":"${LIGHT_THEME_COLOUR}")}}catch(e){}})();`;

function isThemeChoice(value: unknown): value is ThemeChoice {
  return isOneOf(THEME_CHOICES, value);
}

export function readThemeChoice(store?: KeyValueStore | null): ThemeChoice {
  return findStoredValue(THEME_KEY, isThemeChoice, store) ?? "system";
}

export function isDarkResolved(choice: ThemeChoice, prefersDark: boolean): boolean {
  return choice === "dark" || (choice === "system" && prefersDark);
}

export function applyThemeChoice(
  choice: ThemeChoice,
  root: HTMLElement = document.documentElement,
) {
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      "content",
      isDarkResolved(choice, prefersDark) ? DARK_THEME_COLOUR : LIGHT_THEME_COLOUR,
    );
}

export function saveThemeChoice(choice: ThemeChoice, store?: KeyValueStore | null): boolean {
  return saveStoredValue(THEME_KEY, choice, store);
}
