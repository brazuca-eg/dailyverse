import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FAVOURITES_KEY, loadFavourites } from "../core/favourites";
import { FavouriteButton } from "./FavouriteButton";

describe("FavouriteButton", () => {
  afterEach(() => {
    document.documentElement.lang = "";
  });

  it("offers to add a game that is not a favourite", () => {
    render(<FavouriteButton slug="bear-sweeper" />);
    const button = screen.getByRole("button", { name: "Add to favourites" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a game that is already a favourite", () => {
    localStorage.setItem(FAVOURITES_KEY, '["bear-sweeper"]');
    render(<FavouriteButton slug="bear-sweeper" />);
    expect(screen.getByRole("button", { name: "In favourites" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("adds and removes the game, and remembers it", () => {
    render(<FavouriteButton slug="bear-sweeper" />);
    fireEvent.click(screen.getByRole("button", { name: "Add to favourites" }));
    expect(loadFavourites()).toEqual(["bear-sweeper"]);
    fireEvent.click(screen.getByRole("button", { name: "In favourites" }));
    expect(loadFavourites()).toEqual([]);
    expect(screen.getByRole("button", { name: "Add to favourites" })).toBeInTheDocument();
  });

  it("only changes its own game", () => {
    localStorage.setItem(FAVOURITES_KEY, '["switchback"]');
    render(<FavouriteButton slug="bear-sweeper" />);
    fireEvent.click(screen.getByRole("button", { name: "Add to favourites" }));
    expect(loadFavourites()).toEqual(["switchback", "bear-sweeper"]);
  });

  it("is written in the page language", () => {
    document.documentElement.lang = "de";
    render(<FavouriteButton slug="bear-sweeper" />);
    expect(screen.getByRole("button", { name: "Zu Favoriten hinzufügen" })).toBeInTheDocument();
  });
});
