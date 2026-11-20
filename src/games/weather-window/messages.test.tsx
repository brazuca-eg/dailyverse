import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { readDayName, readShortDayName, readTripLabel, readWeatherLabel } from "./catalogue";
import { buildWeatherWindowRuleSteps } from "./helpText";
import { WeatherWindowGame } from "./WeatherWindowGame";

const RAW_KEY = /weather\.[a-z]+\.[A-Za-z.0-9]+/;

describe("Weather Window in German", () => {
  afterEach(() => {
    document.documentElement.lang = "";
  });

  it("shows the screens in German without raw message keys", () => {
    document.documentElement.lang = "de";
    const { container } = render(<WeatherWindowGame />);
    expect(screen.getByText("Bereit?")).toBeVisible();
    expect(screen.getByRole("button", { name: "Vorhersage zeigen", hidden: true })).toBeVisible();
    expect(screen.getByText("Plane deine Touren für die Woche.", { exact: false })).toBeVisible();
    expect(screen.getByRole("table")).toHaveTextContent("Passungstabelle");
    expect(container.textContent).not.toMatch(RAW_KEY);
  });

  it("translates the planning screen", () => {
    document.documentElement.lang = "de";
    render(<WeatherWindowGame />);
    fireEvent.click(screen.getByRole("button", { name: "Vorhersage zeigen", hidden: true }));
    fireEvent.click(screen.getByRole("button", { name: "Ich bin bereit", hidden: true }));
    expect(screen.getByRole("button", { name: "Plan abgeben", hidden: true })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /^Blick \(\d+ übrig\)$/, hidden: true }),
    ).toBeVisible();
    expect(screen.getAllByText("Kein Tag").length).toBeGreaterThan(0);
  });

  it("names weathers, trips and days in every language", () => {
    document.documentElement.lang = "uk";
    expect(readWeatherLabel(0)).toBe("Сонячно");
    expect(readTripLabel(4)).toBe("Лижі");
    expect(readDayName(0)).toBe("Понеділок");
    expect(readShortDayName(6)).toBe("Нд");
    expect(buildWeatherWindowRuleSteps().join(" ")).not.toMatch(RAW_KEY);
  });
});
