import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "./ShareButton";

const TEXT = "Dailyverse Mystery Place #2 2/5\n🟩\nhttps://example.com/mystery-place";

function mockPointer(isCoarse: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isCoarse && query === "(pointer: coarse)",
  })) as unknown as typeof window.matchMedia;
}

function setShare(share: ((data: unknown) => Promise<void>) | undefined) {
  Object.defineProperty(navigator, "share", { value: share, configurable: true });
}

describe("ShareButton with the share sheet of the phone", () => {
  beforeEach(() => {
    mockPointer(true);
  });

  afterEach(() => {
    mockPointer(false);
    setShare(undefined);
    vi.restoreAllMocks();
  });

  it("opens the share sheet with the text and the link apart", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const user = userEvent.setup();
    render(<ShareButton text={TEXT} />);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(share).toHaveBeenCalledWith({
      title: "Dailyverse Mystery Place #2 2/5",
      text: "Dailyverse Mystery Place #2 2/5\n🟩",
      url: "https://example.com/mystery-place",
    });
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
  });

  it("does not copy when the share sheet is closed without sharing", async () => {
    setShare(vi.fn().mockRejectedValue(new DOMException("closed", "AbortError")));
    const write = vi.spyOn(navigator.clipboard, "writeText");
    const user = userEvent.setup();
    render(<ShareButton text={TEXT} />);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(write).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
  });

  it("copies the text when the share sheet fails", async () => {
    setShare(vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")));
    const user = userEvent.setup();
    render(<ShareButton text={TEXT} />);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(await screen.findByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(TEXT);
  });

  it("copies the text when the phone has no share sheet", async () => {
    setShare(undefined);
    const user = userEvent.setup();
    render(<ShareButton text={TEXT} />);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(await screen.findByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();
  });

  it("shares a text without a link as text only", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const user = userEvent.setup();
    render(<ShareButton text="Just text" />);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(share).toHaveBeenCalledWith({ title: "Just text", text: "Just text" });
  });

  it("copies on a computer even if the browser could share", async () => {
    mockPointer(false);
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const user = userEvent.setup();
    render(<ShareButton text={TEXT} />);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(share).not.toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();
  });

  it("can offer another label before it is used", () => {
    render(<ShareButton text={TEXT} idleLabel="Invite friends" />);
    expect(screen.getByRole("button", { name: "Invite friends" })).toBeInTheDocument();
  });
});
