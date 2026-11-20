import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCALE_KEY } from "../i18n/preference";
import { FAVOURITES_KEY } from "../core/favourites";
import { THEME_KEY } from "../theme/theme";
import { SiteMenu } from "./SiteMenu";

function setPage(pathname: string, lang: string) {
  vi.stubGlobal("location", { ...window.location, pathname });
  document.documentElement.lang = lang;
}

function openMenu(name = "Menu") {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("SiteMenu", () => {
  beforeEach(() => {
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    document.head.innerHTML = '<meta name="theme-color" content="#000000">';
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.lang = "";
  });

  it("lists every game under its group, with links in the page language", () => {
    setPage("/", "en");
    render(<SiteMenu />);
    openMenu();
    const nav = screen.getByRole("navigation", { name: "Games" });
    ["World and words", "Logic", "Look and remember"].forEach((heading) => {
      expect(within(nav).getByRole("heading", { name: heading, hidden: true })).toBeInTheDocument();
    });
    expect(within(nav).getAllByRole("link", { hidden: true })).toHaveLength(12);
    expect(within(nav).getByRole("link", { name: "Bear Sweeper", hidden: true })).toHaveAttribute(
      "href",
      "/bear-sweeper/",
    );
    expect(within(nav).getByRole("link", { name: "All games", hidden: true })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(nav).getByRole("link", { name: "My stats", hidden: true })).toHaveAttribute(
      "href",
      "/stats/",
    );
  });

  it("groups the games as announced", () => {
    setPage("/", "en");
    render(<SiteMenu />);
    openMenu();
    const nav = screen.getByRole("navigation", { name: "Games" });
    const sections = within(nav)
      .getAllByRole("heading", { hidden: true })
      .map((heading) => {
        const section = heading.closest("section") as HTMLElement;
        return [heading.textContent, within(section).getAllByRole("link", { hidden: true }).length];
      });
    expect(sections).toEqual([
      ["World and words", 4],
      ["Logic", 4],
      ["Look and remember", 2],
    ]);
  });

  it("marks the game that is open", () => {
    setPage("/switchback/", "en");
    render(<SiteMenu />);
    openMenu();
    const links = screen.getAllByRole("link", { hidden: true, current: "page" });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/switchback/");
  });

  it("marks the game that is open on a page in another language", () => {
    setPage("/de/switchback/", "de");
    render(<SiteMenu />);
    openMenu("Menü");
    const links = screen.getAllByRole("link", { hidden: true, current: "page" });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/de/switchback/");
  });

  it("is written in the page language", () => {
    setPage("/uk/", "uk");
    render(<SiteMenu />);
    openMenu("Меню");
    expect(screen.getByRole("heading", { name: "Світ і слова", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Усі ігри", hidden: true })).toHaveAttribute(
      "href",
      "/uk/",
    );
  });

  it("links to the same page in every language", () => {
    setPage("/tents-and-trees/", "en");
    render(<SiteMenu />);
    openMenu();
    const hrefs = ["English", "Español", "Français", "Italiano", "Deutsch", "Українська"].map(
      (name) => screen.getByRole("link", { name, hidden: true }).getAttribute("href"),
    );
    expect(hrefs).toEqual([
      "/tents-and-trees/",
      "/es/tents-and-trees/",
      "/fr/tents-and-trees/",
      "/it/tents-and-trees/",
      "/de/tents-and-trees/",
      "/uk/tents-and-trees/",
    ]);
    expect(screen.getByRole("link", { name: "English", hidden: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("remembers the language that was picked", () => {
    setPage("/", "en");
    render(<SiteMenu />);
    openMenu();
    fireEvent.click(screen.getByRole("link", { name: "Italiano", hidden: true }));
    expect(localStorage.getItem(LOCALE_KEY)).toBe('"it"');
  });

  it("switches the theme and remembers it", () => {
    setPage("/", "en");
    render(<SiteMenu />);
    openMenu();
    expect(screen.getByRole("radio", { name: "System", hidden: true })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Dark", hidden: true }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_KEY)).toBe('"dark"');
    fireEvent.click(screen.getByRole("radio", { name: "Light", hidden: true }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    fireEvent.click(screen.getByRole("radio", { name: "System", hidden: true }));
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("shows the saved theme when it opens", () => {
    localStorage.setItem(THEME_KEY, '"light"');
    setPage("/", "en");
    render(<SiteMenu />);
    openMenu();
    expect(screen.getByRole("radio", { name: "Light", hidden: true })).toBeChecked();
  });

  it("lists favourite games first, in the order they were added", () => {
    localStorage.setItem(FAVOURITES_KEY, '["weather-window","bear-sweeper"]');
    setPage("/", "en");
    render(<SiteMenu />);
    openMenu();
    const nav = screen.getByRole("navigation", { name: "Games" });
    const headings = within(nav)
      .getAllByRole("heading", { hidden: true })
      .map((heading) => heading.textContent);
    expect(headings[0]).toBe("Favourites");
    const section = within(nav)
      .getByRole("heading", { name: "Favourites", hidden: true })
      .closest("section") as HTMLElement;
    expect(
      within(section)
        .getAllByRole("link", { hidden: true })
        .map((link) => link.textContent),
    ).toEqual(["Weather Window", "Bear Sweeper"]);
  });

  it("has no favourites section when there are none, or when the saved names are unknown", () => {
    localStorage.setItem(FAVOURITES_KEY, '["nope"]');
    setPage("/", "en");
    render(<SiteMenu />);
    openMenu();
    expect(screen.queryByRole("heading", { name: "Favourites", hidden: true })).toBeNull();
  });
});
