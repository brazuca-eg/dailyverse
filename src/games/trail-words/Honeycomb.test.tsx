import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Honeycomb } from "./Honeycomb";

const outer = ["a", "c", "e", "g", "l", "y"];

describe("Honeycomb", () => {
  it("shows the seven letters, with the centre one named", () => {
    render(<Honeycomb centre="m" outer={outer} onLetter={() => undefined} />);
    expect(screen.getAllByRole("button")).toHaveLength(7);
    outer.forEach((letter) => expect(screen.getByRole("button", { name: letter })).toBeVisible());
    expect(screen.getByRole("button", { name: "m, centre letter" })).toBeVisible();
  });

  it("reports the letter that was tapped", () => {
    const onLetter = vi.fn();
    render(<Honeycomb centre="m" outer={outer} onLetter={onLetter} />);
    fireEvent.click(screen.getByRole("button", { name: "g" }));
    fireEvent.click(screen.getByRole("button", { name: "m, centre letter" }));
    expect(onLetter.mock.calls).toEqual([["g"], ["m"]]);
  });

  it("keeps the order it is given, so shuffling moves the letters", () => {
    const { rerender } = render(<Honeycomb centre="m" outer={outer} onLetter={() => undefined} />);
    const first = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
    rerender(<Honeycomb centre="m" outer={[...outer].reverse()} onLetter={() => undefined} />);
    const second = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
    expect(second).not.toEqual(first);
    expect([...second].sort()).toEqual([...first].sort());
  });

  it("can be disabled while the words load", () => {
    const onLetter = vi.fn();
    render(<Honeycomb centre="m" outer={outer} disabled onLetter={onLetter} />);
    screen.getAllByRole("button").forEach((button) => expect(button).toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "g" }));
    expect(onLetter).not.toHaveBeenCalled();
  });
});
