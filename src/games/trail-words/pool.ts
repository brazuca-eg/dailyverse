import { hashString } from "../../core/random";

export interface Candidate {
  letterMask: number;
  centreBit: number;
}

export function selectPool(
  candidates: readonly Candidate[],
  size: number,
  perSetLimit: number,
): Candidate[] {
  const shuffled = [...candidates].sort(
    (a, b) =>
      hashString(`${a.letterMask}:${a.centreBit}`) - hashString(`${b.letterMask}:${b.centreBit}`) ||
      a.letterMask - b.letterMask ||
      a.centreBit - b.centreBit,
  );
  const perSet = new Map<number, number>();
  return shuffled
    .filter((candidate) => {
      const used = perSet.get(candidate.letterMask) ?? 0;
      perSet.set(candidate.letterMask, used + 1);
      return used < perSetLimit;
    })
    .slice(0, size);
}
