import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { countries } from "../../core/countries";
import { GuessInput } from "./GuessInput";

function renderInput(excludedCodes: string[] = []) {
  const onSubmitGuess = vi.fn();
  const user = userEvent.setup();
  render(
    <GuessInput
      countries={countries}
      excludedCodes={excludedCodes}
      onSubmitGuess={onSubmitGuess}
    />,
  );
  const input = screen.getByRole("combobox", { name: "Guess a country" });
  return { user, onSubmitGuess, input };
}

function optionNames(): string[] {
  return screen.queryAllByRole("option").map((option) => option.textContent ?? "");
}

function submittedCodes(onSubmitGuess: ReturnType<typeof vi.fn>): string[] {
  return onSubmitGuess.mock.calls.map(([country]) => country.code);
}

describe("GuessInput suggestions", () => {
  it("shows no suggestions until the player types", () => {
    const { input } = renderInput();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("lists matching countries while typing", async () => {
    const { user, input } = renderInput();
    await user.type(input, "unit");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(optionNames().some((name) => name.includes("United Kingdom"))).toBe(true);
  });

  it("leaves out countries that were already guessed", async () => {
    const { user, input } = renderInput(["BR"]);
    await user.type(input, "bra");
    expect(optionNames().join(" ")).not.toContain("Brazil");
  });

  it("matches aliases and ignores accents", async () => {
    const { user, input } = renderInput();
    await user.type(input, "ivory");
    expect(optionNames().join(" ")).toContain("Côte d'Ivoire");
  });

  it("moves the highlight with the arrow keys and wraps around", async () => {
    const { user, input } = renderInput();
    await user.type(input, "unit");
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(2);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);

    await user.keyboard("{ArrowDown}");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);

    await user.keyboard("{ArrowUp}{ArrowUp}");
    const last = options[options.length - 1];
    expect(last).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", last.id);
  });
});

describe("GuessInput submitting", () => {
  it("selects the highlighted suggestion on Enter and submits it on a second Enter", async () => {
    const { user, input, onSubmitGuess } = renderInput();
    await user.type(input, "unit");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("United Arab Emirates");
    expect(onSubmitGuess).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(submittedCodes(onSubmitGuess)).toEqual(["AE"]);
    expect(input).toHaveValue("");
  });

  it("submits straight away when the full country name is typed", async () => {
    const { user, input, onSubmitGuess } = renderInput();
    await user.type(input, "Brazil{Enter}");
    expect(submittedCodes(onSubmitGuess)).toEqual(["BR"]);
    expect(input).toHaveValue("");
  });

  it("accepts an alias as a full name", async () => {
    const { user, input, onSubmitGuess } = renderInput();
    await user.type(input, "UK{Enter}");
    expect(submittedCodes(onSubmitGuess)).toEqual(["GB"]);
  });

  it("selects a clicked suggestion and submits it with the Guess button", async () => {
    const { user, input, onSubmitGuess } = renderInput();
    await user.type(input, "bra");
    await user.click(screen.getByRole("option", { name: /Brazil/ }));
    expect(input).toHaveValue("Brazil");
    expect(onSubmitGuess).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Guess" }));
    expect(submittedCodes(onSubmitGuess)).toEqual(["BR"]);
  });

  it("keeps focus in the input after a guess so the next one can be typed straight away", async () => {
    const { user, input } = renderInput();
    await user.type(input, "Brazil{Enter}");
    expect(input).toHaveFocus();
  });

  it("returns focus to the input after the Guess button is clicked", async () => {
    const { user, input } = renderInput();
    await user.type(input, "Brazil");
    await user.click(screen.getByRole("button", { name: "Guess" }));
    expect(input).toHaveFocus();
  });

  it("clears the text with Escape", async () => {
    const { user, input } = renderInput();
    await user.type(input, "bra");
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("GuessInput errors", () => {
  it("asks for a country when the Guess button is pressed with nothing typed", async () => {
    const { user, input, onSubmitGuess } = renderInput();
    await user.click(screen.getByRole("button", { name: "Guess" }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Type a country to guess.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
    expect(onSubmitGuess).not.toHaveBeenCalled();
  });

  it("asks the player to pick from the list when the text is not a country", async () => {
    const { user, input, onSubmitGuess } = renderInput();
    await user.type(input, "atlantis{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("Pick a country from the list.");
    expect(onSubmitGuess).not.toHaveBeenCalled();
  });

  it("refuses a country that was already guessed", async () => {
    const { user, input, onSubmitGuess } = renderInput(["BR"]);
    await user.type(input, "Brazil{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("You already guessed that one.");
    expect(onSubmitGuess).not.toHaveBeenCalled();
  });

  it("removes the error as soon as the player edits the text", async () => {
    const { user, input } = renderInput();
    await user.click(screen.getByRole("button", { name: "Guess" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.type(input, "b");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");
  });
});
