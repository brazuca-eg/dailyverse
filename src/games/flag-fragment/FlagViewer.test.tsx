import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { findFlagUrl } from "./flagImages";
import { FlagViewer } from "./FlagViewer";
import { REVEAL_STAGES } from "./game";

const focus = { x: 0.5, y: 0.5 };

function renderViewer(stage: (typeof REVEAL_STAGES)[number], code = "CH") {
  const { container } = render(<FlagViewer code={code} focus={focus} stage={stage} />);
  return container.querySelector("img");
}

describe("FlagViewer", () => {
  it("labels each view by its position without giving the country away", () => {
    REVEAL_STAGES.forEach((stage, index) => {
      const { unmount } = render(<FlagViewer code="CH" focus={focus} stage={stage} />);
      const label = screen.getByRole("img").getAttribute("aria-label");
      expect(label).toBe(`Mystery flag, view ${index + 1} of 5`);
      expect(label?.toLowerCase()).not.toContain("switzerland");
      unmount();
    });
  });

  it("shows the flag image of the given country", () => {
    expect(renderViewer("full")?.getAttribute("src")).toBe(findFlagUrl("CH"));
  });

  it("zooms in on the first view", () => {
    const image = renderViewer("crop-small");
    expect(image?.style.width).toBe("400%");
    expect(image?.style.left).toBe("-150%");
    expect(image?.style.filter).toBe("none");
  });

  it("blurs the third view", () => {
    const image = renderViewer("blurred");
    expect(image?.style.width).toBe("100%");
    expect(image?.style.filter).toBe("blur(14px)");
  });

  it("removes the colour in the fourth view", () => {
    expect(renderViewer("greyscale")?.style.filter).toBe("grayscale(1)");
  });

  it("shows the clear, whole flag in the last view", () => {
    const image = renderViewer("full");
    expect(image?.style.width).toBe("100%");
    expect(image?.style.filter).toBe("none");
  });

  it("hides the picture from screen readers", () => {
    expect(renderViewer("full")).toHaveAttribute("alt", "");
  });

  it("shows an empty frame for an unknown flag", () => {
    expect(renderViewer("full", "ZZ")).toBeNull();
  });
});
