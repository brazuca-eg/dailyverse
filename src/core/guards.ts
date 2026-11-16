export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isOneOf<T extends string>(allowedValues: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (allowedValues as readonly string[]).includes(value);
}
