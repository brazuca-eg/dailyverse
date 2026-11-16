import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAP_TOLERANCE } from "./game";
import { MARKER_COLOURS } from "./markerColours";
import { generatePuzzle } from "./puzzle";
import { SceneView } from "./SceneView";

const puzzle = generatePuzzle(3, "medium");
const [first, second] = puzzle.differences;

type Props = Partial<Parameters<typeof SceneView>[0]>;

function mockFrame(width: number, height: number) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    left: 100,
    top: 50,
    width,
    height,
    right: 100 + width,
    bottom: 50 + height,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  });
}

function renderScene(props: Props = {}) {
  const handlers = {
    onTap: vi.fn(),
    onCrosshairChange: vi.fn(),
    onFrameScroll: vi.fn(),
  };
  const view = render(
    <SceneView
      scene={puzzle.altered}
      label="Second picture"
      differences={puzzle.differences}
      foundIds={[]}
      revealAll={false}
      miss={null}
      crosshair={null}
      zoomed={false}
      {...handlers}
      {...props}
    />,
  );
  const picture = screen.getByRole("button", { name: /^Second picture/ });
  return { ...handlers, ...view, picture };
}

describe("SceneView", () => {
  beforeEach(() => {
    mockFrame(400, 300);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is a button named after the picture, with the keyboard instructions", () => {
    const { picture } = renderScene();
    expect(picture.getAttribute("aria-label")).toBe(
      "Second picture. Use the arrow keys to move the crosshair, and Enter or Space to mark a difference.",
    );
  });

  it("hides the drawing itself from screen readers", () => {
    const { container } = renderScene();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("draws exactly what the renderer draws, so it matches what was verified", () => {
    const { container } = renderScene();
    const ids = [...container.querySelectorAll("g[data-id]")].map((node) =>
      node.getAttribute("data-id"),
    );
    expect(ids).toEqual(puzzle.altered.elements.map((element) => element.id));
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 800 600");
  });

  it("shows no marker before anything is found", () => {
    const { container } = renderScene();
    expect(container.querySelectorAll(".marker")).toHaveLength(0);
  });

  it("circles each found difference, centred on it", () => {
    const { container } = renderScene({ foundIds: [first.id, second.id] });
    expect(container.querySelectorAll(".marker-found")).toHaveLength(2);
    const marker = container.querySelector(".marker-found");
    expect(Number(marker?.getAttribute("cx"))).toBeCloseTo(
      (first.region.left + first.region.right) / 2,
    );
    expect(Number(marker?.getAttribute("cy"))).toBeCloseTo(
      (first.region.top + first.region.bottom) / 2,
    );
  });

  it("puts a white halo behind every marker so it stands out on any ground", () => {
    const { container } = renderScene({ foundIds: [first.id], revealAll: true });
    const halos = container.querySelectorAll(".marker-halo");
    expect(halos).toHaveLength(5);
    halos.forEach((halo) => expect(halo.getAttribute("stroke")).toBe("#ffffff"));
    container.querySelectorAll(".marker").forEach((marker, index) => {
      expect(marker.getAttribute("cx")).toBe(halos[index].getAttribute("cx"));
      expect(marker.getAttribute("rx")).toBe(halos[index].getAttribute("rx"));
    });
  });

  it("draws found circles dark green and missed ones dark red, from the shared colours", () => {
    const { container } = renderScene({ foundIds: [first.id], revealAll: true });
    expect(container.querySelector(".marker-found")?.getAttribute("stroke")).toBe(
      MARKER_COLOURS.found,
    );
    container.querySelectorAll(".marker-missed").forEach((marker) => {
      expect(marker.getAttribute("stroke")).toBe(MARKER_COLOURS.missed);
    });
  });

  it("animates only the circles that were found", () => {
    const { container } = renderScene({ foundIds: [first.id], revealAll: true });
    expect(container.querySelectorAll(".marker-draw")).toHaveLength(2);
    expect(container.querySelector(".marker-found")).toHaveClass("marker-draw");
    expect(container.querySelector(".marker-missed")).not.toHaveClass("marker-draw");
  });

  it("draws the wrong-tap cross with a halo in the shared colours", () => {
    const { container } = renderScene({ miss: { point: { x: 10, y: 10 }, key: 1 } });
    expect(container.querySelector(".miss-halo")?.getAttribute("stroke")).toBe(MARKER_COLOURS.halo);
    expect(container.querySelector(".miss-cross")?.getAttribute("stroke")).toBe(
      MARKER_COLOURS.missed,
    );
  });

  it("never draws a marker smaller than a fingertip", () => {
    const { container } = renderScene({ revealAll: true });
    container.querySelectorAll(".marker").forEach((marker) => {
      expect(Number(marker.getAttribute("rx"))).toBeGreaterThanOrEqual(16);
      expect(Number(marker.getAttribute("ry"))).toBeGreaterThanOrEqual(16);
    });
  });

  it("reveals every difference when asked, marking the ones not found differently", () => {
    const { container } = renderScene({ foundIds: [first.id], revealAll: true });
    expect(container.querySelectorAll(".marker-found")).toHaveLength(1);
    expect(container.querySelectorAll(".marker-missed")).toHaveLength(4);
  });

  it("shows a mark where the last wrong tap was, and none when there was none", () => {
    const { container, unmount } = renderScene({ miss: { point: { x: 120, y: 340 }, key: 1 } });
    const mark = container.querySelector(".miss-mark");
    expect(mark?.getAttribute("transform")).toBe("translate(120 340)");
    expect(mark?.querySelectorAll(".miss-cross line")).toHaveLength(2);
    expect(mark?.querySelectorAll(".miss-halo line")).toHaveLength(2);
    unmount();
    expect(renderScene().container.querySelector(".miss-mark")).toBeNull();
  });
});

describe("SceneView pointer taps", () => {
  beforeEach(() => {
    mockFrame(400, 300);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports a tap as a point in the scene's own coordinates and hides the crosshair", () => {
    const { onTap, onCrosshairChange, picture } = renderScene({ crosshair: { x: 1, y: 1 } });
    fireEvent.click(picture, { clientX: 300, clientY: 200, detail: 1 });
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onTap.mock.calls[0][0]).toEqual({ x: 400, y: 300 });
    expect(onCrosshairChange).toHaveBeenCalledWith(null);
  });

  it("reports taps at the corners correctly", () => {
    const { onTap, picture } = renderScene();
    fireEvent.click(picture, { clientX: 100, clientY: 50, detail: 1 });
    fireEvent.click(picture, { clientX: 500, clientY: 350, detail: 1 });
    expect(onTap.mock.calls[0][0]).toEqual({ x: 0, y: 0 });
    expect(onTap.mock.calls[1][0]).toEqual({ x: 800, y: 600 });
  });

  it("widens the tolerance when the picture is shown small, so a fingertip can hit", () => {
    const { onTap, picture } = renderScene();
    fireEvent.click(picture, { clientX: 300, clientY: 200, detail: 1 });
    expect(onTap.mock.calls[0][1]).toBe(24);
  });

  it("keeps the normal tolerance when the picture is large", () => {
    vi.restoreAllMocks();
    mockFrame(800, 600);
    const { onTap, picture } = renderScene();
    fireEvent.click(picture, { clientX: 300, clientY: 200, detail: 1 });
    expect(onTap.mock.calls[0][1]).toBe(TAP_TOLERANCE);
  });

  it("ignores the click a keyboard press produces on a button", () => {
    const { onTap, picture } = renderScene();
    fireEvent.click(picture, { clientX: 0, clientY: 0, detail: 0 });
    expect(onTap).not.toHaveBeenCalled();
  });
});

describe("SceneView keyboard", () => {
  beforeEach(() => {
    mockFrame(400, 300);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts the crosshair at the centre and moves it by a step from there", () => {
    const { onCrosshairChange, picture } = renderScene();
    fireEvent.keyDown(picture, { key: "ArrowRight" });
    expect(onCrosshairChange).toHaveBeenCalledWith({ x: 424, y: 300 });
  });

  it("moves the crosshair from where it already is", () => {
    const { onCrosshairChange, picture } = renderScene({ crosshair: { x: 100, y: 200 } });
    fireEvent.keyDown(picture, { key: "ArrowDown" });
    fireEvent.keyDown(picture, { key: "ArrowLeft" });
    expect(onCrosshairChange).toHaveBeenNthCalledWith(1, { x: 100, y: 224 });
    expect(onCrosshairChange).toHaveBeenNthCalledWith(2, { x: 76, y: 200 });
  });

  it("moves in small steps with Shift held", () => {
    const { onCrosshairChange, picture } = renderScene({ crosshair: { x: 100, y: 200 } });
    fireEvent.keyDown(picture, { key: "ArrowUp", shiftKey: true });
    expect(onCrosshairChange).toHaveBeenCalledWith({ x: 100, y: 194 });
  });

  it("keeps the crosshair inside the picture", () => {
    const { onCrosshairChange, picture } = renderScene({ crosshair: { x: 5, y: 5 } });
    fireEvent.keyDown(picture, { key: "ArrowLeft" });
    expect(onCrosshairChange).toHaveBeenCalledWith({ x: 0, y: 5 });
  });

  it("only shows the crosshair, without tapping, the first time Enter is pressed", () => {
    const { onTap, onCrosshairChange, picture } = renderScene();
    fireEvent.keyDown(picture, { key: "Enter" });
    expect(onTap).not.toHaveBeenCalled();
    expect(onCrosshairChange).toHaveBeenCalledWith({ x: 400, y: 300 });
  });

  it("taps where the crosshair is on Enter or Space, with the normal tolerance", () => {
    const { onTap, picture } = renderScene({ crosshair: { x: 150, y: 250 } });
    fireEvent.keyDown(picture, { key: "Enter" });
    fireEvent.keyDown(picture, { key: " " });
    expect(onTap).toHaveBeenNthCalledWith(1, { x: 150, y: 250 }, TAP_TOLERANCE);
    expect(onTap).toHaveBeenNthCalledWith(2, { x: 150, y: 250 }, TAP_TOLERANCE);
  });

  it("stops the page from scrolling or clicking for the keys it handles", () => {
    const { picture } = renderScene({ crosshair: { x: 150, y: 250 } });
    expect(fireEvent.keyDown(picture, { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(picture, { key: "Enter" })).toBe(false);
    expect(fireEvent.keyDown(picture, { key: " " })).toBe(false);
  });

  it("leaves every other key alone, so Tab still moves on", () => {
    const { onTap, onCrosshairChange, picture } = renderScene();
    expect(fireEvent.keyDown(picture, { key: "Tab" })).toBe(true);
    fireEvent.keyDown(picture, { key: "a" });
    expect(onTap).not.toHaveBeenCalled();
    expect(onCrosshairChange).not.toHaveBeenCalled();
  });

  it("draws the crosshair with a ring showing how close a tap counts", () => {
    const { container } = renderScene({ crosshair: { x: 150, y: 250 } });
    const crosshair = container.querySelector(".crosshair");
    expect(crosshair?.getAttribute("transform")).toBe("translate(150 250)");
    expect(crosshair?.querySelector("circle")?.getAttribute("r")).toBe(String(TAP_TOLERANCE));
    expect(crosshair?.querySelectorAll("line")).toHaveLength(2);
  });

  it("draws no crosshair until the keyboard is used", () => {
    expect(renderScene().container.querySelector(".crosshair")).toBeNull();
  });
});

describe("SceneView zoom and scrolling", () => {
  beforeEach(() => {
    mockFrame(400, 300);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is a scrollable zoomed frame only when zoomed", () => {
    const { container, unmount } = renderScene();
    expect(container.querySelector(".scene-frame-zoomed")).toBeNull();
    unmount();
    expect(
      renderScene({ zoomed: true }).container.querySelector(".scene-frame-zoomed"),
    ).not.toBeNull();
  });

  it("tells the game when the frame scrolls, with the frame itself", () => {
    const { onFrameScroll, container } = renderScene({ zoomed: true });
    const frame = container.querySelector(".scene-frame") as HTMLDivElement;
    fireEvent.scroll(frame);
    expect(onFrameScroll).toHaveBeenCalledWith(frame);
  });

  it("hands the frame element to a ref", () => {
    const frameRef = createRef<HTMLDivElement>();
    const { container } = renderScene({ frameRef });
    expect(frameRef.current).toBe(container.querySelector(".scene-frame"));
  });
});
