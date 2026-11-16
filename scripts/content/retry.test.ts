import { describe, expect, it } from "vitest";
import { readRetryAfterSeconds } from "./retry";

describe("readRetryAfterSeconds", () => {
  it("uses the header when it is a positive number of seconds", () => {
    expect(readRetryAfterSeconds("7", 15)).toBe(7);
    expect(readRetryAfterSeconds("0.5", 15)).toBe(0.5);
  });

  it("falls back when the header is missing, zero, negative or not a number", () => {
    expect(readRetryAfterSeconds(null, 15)).toBe(15);
    expect(readRetryAfterSeconds("0", 15)).toBe(15);
    expect(readRetryAfterSeconds("-3", 15)).toBe(15);
    expect(readRetryAfterSeconds("soon", 15)).toBe(15);
  });
});
