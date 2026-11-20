import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCALE_KEY, readLocalePreference } from "../i18n/preference";
import { LanguageSuggestion, findRedirectLocale, findSuggestedLocale } from "./LanguageSuggestion";

function setBrowserLanguages(languages: string[]) {
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
}

describe("findSuggestedLocale", () => {
  it("suggests the browser language when it is supported and not English", () => {
    expect(findSuggestedLocale(null, ["de-DE", "en"])).toBe("de");
  });

  it("suggests nothing for English, an unsupported language or when the player already chose", () => {
    expect(findSuggestedLocale(null, ["en-US"])).toBeNull();
    expect(findSuggestedLocale(null, ["ja"])).toBeNull();
    expect(findSuggestedLocale("en", ["de"])).toBeNull();
    expect(findSuggestedLocale("fr", ["de"])).toBeNull();
  });
});

describe("findRedirectLocale", () => {
  it("redirects only from the English home page, to a language the player chose", () => {
    expect(findRedirectLocale("uk", "/")).toBe("uk");
    expect(findRedirectLocale("uk", "/bear-sweeper/")).toBeNull();
    expect(findRedirectLocale("en", "/")).toBeNull();
    expect(findRedirectLocale(null, "/")).toBeNull();
  });
});

describe("LanguageSuggestion", () => {
  const replace = vi.fn();

  beforeEach(() => {
    replace.mockReset();
    vi.stubGlobal("location", { ...window.location, pathname: "/", replace });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("offers the browser language in that language", () => {
    setBrowserLanguages(["es-ES"]);
    render(<LanguageSuggestion />);
    expect(screen.getByText("Este sitio también está disponible en Español.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Cambiar a Español" })).toHaveAttribute("href", "/es/");
  });

  it("offers nothing when the browser speaks English", () => {
    setBrowserLanguages(["en-GB"]);
    const { container } = render(<LanguageSuggestion />);
    expect(container).toBeEmptyDOMElement();
  });

  it("remembers the choice when the player accepts", () => {
    setBrowserLanguages(["fr"]);
    render(<LanguageSuggestion />);
    fireEvent.click(screen.getByRole("link", { name: "Passer en Français" }));
    expect(readLocalePreference()).toBe("fr");
  });

  it("goes away and stays English when the player declines", () => {
    setBrowserLanguages(["it"]);
    render(<LanguageSuggestion />);
    fireEvent.click(screen.getByRole("button", { name: "No, grazie" }));
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(readLocalePreference()).toBe("en");
  });

  it("sends a returning visitor to the language they chose", () => {
    localStorage.setItem(LOCALE_KEY, '"de"');
    setBrowserLanguages(["en"]);
    render(<LanguageSuggestion />);
    expect(replace).toHaveBeenCalledWith("/de/");
  });

  it("does not redirect a visitor who chose English", () => {
    localStorage.setItem(LOCALE_KEY, '"en"');
    setBrowserLanguages(["de"]);
    const { container } = render(<LanguageSuggestion />);
    expect(replace).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
