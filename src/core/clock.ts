interface TimedState {
  elapsedSeconds: number;
}

function isSameValue(first: unknown, second: unknown): boolean {
  if (Array.isArray(first) && Array.isArray(second)) {
    return (
      first.length === second.length &&
      first.every((item, index) => isSameValue(item, second[index]))
    );
  }
  if (
    typeof first === "object" &&
    typeof second === "object" &&
    first !== null &&
    second !== null
  ) {
    const keys = Object.keys(first);
    return (
      keys.length === Object.keys(second).length &&
      keys.every((key) =>
        isSameValue(
          (first as Record<string, unknown>)[key],
          (second as Record<string, unknown>)[key],
        ),
      )
    );
  }
  return first === second;
}

export function hasStartedPlaying<T extends TimedState>(state: T, initial: T): boolean {
  return state.elapsedSeconds > 0 || !isSameValue({ ...state, elapsedSeconds: 0 }, initial);
}
