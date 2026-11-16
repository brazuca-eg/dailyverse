import { describe, expect, it } from "vitest";
import { copyTextToClipboard, type ClipboardLike } from "./clipboard";

describe("copyTextToClipboard", () => {
  it("writes the text and reports success", async () => {
    const written: string[] = [];
    const clipboard: ClipboardLike = {
      writeText: async (text) => {
        written.push(text);
      },
    };
    expect(await copyTextToClipboard("hello", clipboard)).toBe(true);
    expect(written).toEqual(["hello"]);
  });

  it("reports failure when the clipboard rejects", async () => {
    const clipboard: ClipboardLike = {
      writeText: async () => {
        throw new Error("denied");
      },
    };
    expect(await copyTextToClipboard("hello", clipboard)).toBe(false);
  });

  it("reports failure when there is no clipboard", async () => {
    expect(await copyTextToClipboard("hello", undefined)).toBe(false);
  });
});
