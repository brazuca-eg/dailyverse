import { describe, expect, it } from "vitest";
import { FAVOURITES_KEY, isFavourite, loadFavourites, toggleFavourite } from "./favourites";
import { createMemoryStore } from "./testing";

describe("favourites", () => {
  it("starts empty", () => {
    expect(loadFavourites(createMemoryStore())).toEqual([]);
  });

  it("adds a game, keeping the order they were added in", () => {
    const store = createMemoryStore();
    expect(toggleFavourite("bear-sweeper", store)).toEqual(["bear-sweeper"]);
    expect(toggleFavourite("switchback", store)).toEqual(["bear-sweeper", "switchback"]);
    expect(loadFavourites(store)).toEqual(["bear-sweeper", "switchback"]);
  });

  it("removes a game that is toggled again and keeps the others", () => {
    const store = createMemoryStore();
    toggleFavourite("a", store);
    toggleFavourite("b", store);
    expect(toggleFavourite("a", store)).toEqual(["b"]);
    expect(isFavourite("a", store)).toBe(false);
    expect(isFavourite("b", store)).toBe(true);
  });

  it("ignores stored values that are not a list of names", () => {
    expect(loadFavourites(createMemoryStore({ [FAVOURITES_KEY]: '{"a":1}' }))).toEqual([]);
    expect(loadFavourites(createMemoryStore({ [FAVOURITES_KEY]: "[1,2]" }))).toEqual([]);
    expect(loadFavourites(createMemoryStore({ [FAVOURITES_KEY]: "oops" }))).toEqual([]);
  });

  it("drops repeated names", () => {
    expect(loadFavourites(createMemoryStore({ [FAVOURITES_KEY]: '["a","a","b"]' }))).toEqual([
      "a",
      "b",
    ]);
  });

  it("still returns the new list when storage cannot save", () => {
    expect(toggleFavourite("a", null)).toEqual(["a"]);
  });
});
