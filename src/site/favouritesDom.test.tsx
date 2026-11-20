import { fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FAVOURITES_KEY, loadFavourites } from "../core/favourites";
import { markDoneToday } from "../core/doneToday";
import { initFavourites, syncFavourites } from "./favouritesDom";

function buildPage(): Document {
  document.body.innerHTML = `
    <section id="favourites" class="home-group" hidden>
      <ul id="favourites-list"></ul>
    </section>
    <section class="home-group">
      <ul>
        ${["alpha", "beta", "gamma"]
          .map(
            (slug) => `
          <li data-game-slug="${slug}">
            <a href="/${slug}">${slug}</a>
            <span data-done-game="${slug}" hidden>done</span>
            <button type="button" data-fav-slug="${slug}" data-label-add="Add ${slug}" data-label-remove="Remove ${slug}" aria-pressed="false" aria-label="Add ${slug}" hidden></button>
          </li>`,
          )
          .join("")}
      </ul>
    </section>`;
  return document;
}

function readFavouriteNames(): string[] {
  return Array.from(document.querySelectorAll("#favourites-list > li")).map(
    (item) => (item as HTMLElement).dataset.gameSlug ?? "",
  );
}

function toggleButton(slug: string, inFavourites = false): HTMLButtonElement {
  const scope = inFavourites ? "#favourites-list" : ".home-group:not(#favourites)";
  return document.querySelector(`${scope} [data-fav-slug="${slug}"]`) as HTMLButtonElement;
}

describe("favourites on the home page", () => {
  const disposers: (() => void)[] = [];

  function start() {
    disposers.push(initFavourites(document));
  }

  beforeEach(() => {
    buildPage();
  });

  afterEach(() => {
    disposers.splice(0).forEach((dispose) => dispose());
  });

  it("keeps the favourites section hidden and the stars off when there are none", () => {
    syncFavourites(document);
    expect(document.getElementById("favourites")).toHaveAttribute("hidden");
    expect(toggleButton("alpha")).toHaveAttribute("aria-pressed", "false");
    expect(toggleButton("alpha").hidden).toBe(false);
  });

  it("shows saved favourites in the order they were added, as copies of the cards", () => {
    localStorage.setItem(FAVOURITES_KEY, '["gamma","alpha"]');
    syncFavourites(document);
    expect(document.getElementById("favourites")).not.toHaveAttribute("hidden");
    expect(readFavouriteNames()).toEqual(["gamma", "alpha"]);
    expect(toggleButton("gamma")).toHaveAttribute("aria-pressed", "true");
    expect(toggleButton("beta")).toHaveAttribute("aria-pressed", "false");
  });

  it("ignores a saved name that is not a game on the page", () => {
    localStorage.setItem(FAVOURITES_KEY, '["nope","beta"]');
    syncFavourites(document);
    expect(readFavouriteNames()).toEqual(["beta"]);
  });

  it("adds a game when its star is tapped, and saves it", () => {
    start();
    fireEvent.click(toggleButton("beta"));
    expect(loadFavourites()).toEqual(["beta"]);
    expect(readFavouriteNames()).toEqual(["beta"]);
    expect(toggleButton("beta")).toHaveAttribute("aria-pressed", "true");
    expect(toggleButton("beta")).toHaveAttribute("aria-label", "Remove beta");
  });

  it("removes a game when its star is tapped again, from either copy of the card", () => {
    start();
    fireEvent.click(toggleButton("beta"));
    fireEvent.click(toggleButton("beta", true));
    expect(loadFavourites()).toEqual([]);
    expect(readFavouriteNames()).toEqual([]);
    expect(document.getElementById("favourites")).toHaveAttribute("hidden");
    expect(toggleButton("beta")).toHaveAttribute("aria-label", "Add beta");
  });

  it("keeps the other favourites when one is removed", () => {
    start();
    fireEvent.click(toggleButton("alpha"));
    fireEvent.click(toggleButton("gamma"));
    fireEvent.click(toggleButton("alpha"));
    expect(readFavouriteNames()).toEqual(["gamma"]);
  });

  it("shows which favourite games were finished today", () => {
    markDoneToday("gamma");
    localStorage.setItem(FAVOURITES_KEY, '["gamma"]');
    syncFavourites(document);
    const copy = document.querySelector("#favourites-list [data-done-game]") as HTMLElement;
    expect(copy.hidden).toBe(false);
  });

  it("ignores taps that are not on a star", () => {
    start();
    fireEvent.click(document.querySelector("a") as HTMLElement);
    expect(loadFavourites()).toEqual([]);
  });
});
