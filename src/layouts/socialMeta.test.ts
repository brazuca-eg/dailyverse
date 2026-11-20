import { describe, expect, it } from "vitest";
import { buildAlternateLinks, buildSocialTags } from "./socialMeta";

const site = new URL("https://dailyverse.example");
const input = {
  site,
  pathname: "/de/bear-sweeper/",
  locale: "de" as const,
  title: "Bärensuche – Dailyverse",
  description: "Finde die Bären.",
};

function find(property: string) {
  return buildSocialTags(input).find((tag) => tag.property === property || tag.name === property);
}

describe("buildSocialTags", () => {
  it("gives the page title, description and the address of this page", () => {
    expect(find("og:title")?.content).toBe("Bärensuche – Dailyverse");
    expect(find("og:description")?.content).toBe("Finde die Bären.");
    expect(find("og:url")?.content).toBe("https://dailyverse.example/de/bear-sweeper/");
  });

  it("uses a full address for the picture and a large card on social sites", () => {
    expect(find("og:image")?.content).toBe("https://dailyverse.example/og-image.png");
    expect(find("twitter:image")?.content).toBe("https://dailyverse.example/og-image.png");
    expect(find("twitter:card")?.content).toBe("summary_large_image");
  });

  it("tells the language of the page", () => {
    expect(find("og:locale")?.content).toBe("de_DE");
    expect(
      buildSocialTags({ ...input, locale: "uk" }).find((t) => t.property === "og:locale")?.content,
    ).toBe("uk_UA");
  });
});

describe("buildAlternateLinks", () => {
  it("links the same page in every language, English without a prefix", () => {
    const links = buildAlternateLinks(site, "/de/bear-sweeper/");
    expect(links.find((link) => link.hreflang === "en")?.href).toBe(
      "https://dailyverse.example/bear-sweeper/",
    );
    expect(links.find((link) => link.hreflang === "uk")?.href).toBe(
      "https://dailyverse.example/uk/bear-sweeper/",
    );
    expect(links).toHaveLength(7);
  });

  it("points x-default at the English page", () => {
    expect(
      buildAlternateLinks(site, "/uk/").find((link) => link.hreflang === "x-default")?.href,
    ).toBe("https://dailyverse.example/");
  });

  it("works for the home page", () => {
    expect(buildAlternateLinks(site, "/").find((link) => link.hreflang === "fr")?.href).toBe(
      "https://dailyverse.example/fr/",
    );
  });
});
