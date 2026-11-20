import { describe, expect, it, vi } from "vitest";
import { shareNatively, splitShareUrl } from "./nativeShare";

describe("splitShareUrl", () => {
  it("takes the link off the last line", () => {
    expect(splitShareUrl("Result line\nSecond\nhttps://example.com/x")).toEqual({
      text: "Result line\nSecond",
      url: "https://example.com/x",
    });
  });

  it("leaves a text without a link as it is", () => {
    expect(splitShareUrl("Result line\nSecond")).toEqual({
      text: "Result line\nSecond",
      url: null,
    });
  });

  it("only takes a link from the last line", () => {
    expect(splitShareUrl("https://example.com/x\nResult")).toEqual({
      text: "https://example.com/x\nResult",
      url: null,
    });
  });

  it("does not take a last line that only starts with a link", () => {
    expect(splitShareUrl("Result\nhttps://example.com/x and more")).toEqual({
      text: "Result\nhttps://example.com/x and more",
      url: null,
    });
  });
});

describe("shareNatively", () => {
  const data = { text: "Hi", url: "https://example.com" };

  it("is unsupported without a share function", async () => {
    expect(await shareNatively(data, {})).toBe("unsupported");
    expect(await shareNatively(data, undefined)).toBe("unsupported");
  });

  it("is unsupported when the browser refuses this data", async () => {
    const share = vi.fn();
    expect(await shareNatively(data, { share, canShare: () => false })).toBe("unsupported");
    expect(share).not.toHaveBeenCalled();
  });

  it("hands the data to the share sheet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await shareNatively(data, { share, canShare: () => true })).toBe("shared");
    expect(share).toHaveBeenCalledWith(data);
  });

  it("tells a closed share sheet from a failure", async () => {
    const closed = vi.fn().mockRejectedValue(new DOMException("closed", "AbortError"));
    expect(await shareNatively(data, { share: closed })).toBe("cancelled");
    const broken = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    expect(await shareNatively(data, { share: broken })).toBe("failed");
    const odd = vi.fn().mockRejectedValue(new Error("x"));
    expect(await shareNatively(data, { share: odd })).toBe("failed");
  });
});
