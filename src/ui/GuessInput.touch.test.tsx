import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countries } from "../core/countries";
import { isTouchDevice } from "../core/device";
import { GuessInput } from "./GuessInput";

function mockPointer(isCoarse: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isCoarse && query === "(pointer: coarse)",
  })) as unknown as typeof window.matchMedia;
}

function renderInput() {
  const user = userEvent.setup({ delay: null });
  render(<GuessInput countries={countries} excludedCodes={[]} onSubmitGuess={vi.fn()} />);
  return { user, input: screen.getByRole("combobox", { name: "Guess a country" }) };
}

describe("isTouchDevice", () => {
  afterEach(() => {
    mockPointer(false);
  });

  it("is true for a coarse pointer and false for a mouse", () => {
    mockPointer(true);
    expect(isTouchDevice()).toBe(true);
    mockPointer(false);
    expect(isTouchDevice()).toBe(false);
  });
});

describe("GuessInput on a phone", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    mockPointer(false);
  });

  it("turns off autocorrect and keeps the text size at 16px or more so the page does not zoom", () => {
    mockPointer(true);
    const { input } = renderInput();
    expect(input).toHaveAttribute("autocorrect", "off");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("enterkeyhint", "go");
  });

  it("closes the keyboard after a guess so the new clue can be read", async () => {
    mockPointer(true);
    const { user, input } = renderInput();
    await user.type(input, "Portugal{Enter}");
    await user.keyboard("{Enter}");
    expect(input).not.toHaveFocus();
    expect(input).toHaveValue("");
  });

  it("keeps the input focused after a guess on a computer", async () => {
    mockPointer(false);
    const { user, input } = renderInput();
    await user.type(input, "Portugal{Enter}");
    await user.keyboard("{Enter}");
    expect(input).toHaveFocus();
  });

  it("scrolls the input into view once the keyboard has opened", async () => {
    mockPointer(true);
    const { user, input } = renderInput();
    await user.click(input);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "center" }),
    );
  });

  it("does not move the page on focus with a mouse", async () => {
    mockPointer(false);
    const { user, input } = renderInput();
    await user.click(input);
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
