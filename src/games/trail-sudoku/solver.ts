import type { Random } from "../../core/random";
import { shuffle } from "../../core/random";
import { buildPeers, fullMask, listDigits, toBit, type Layout } from "./layout";

const peersByLayout = new Map<string, number[][]>();

export function readPeers(layout: Layout): number[][] {
  const key = `${layout.size}:${layout.boxRows}:${layout.boxCols}`;
  const known = peersByLayout.get(key);
  if (known) {
    return known;
  }
  const peers = buildPeers(layout);
  peersByLayout.set(key, peers);
  return peers;
}

export function computeCandidates(layout: Layout, grid: readonly number[]): number[] | null {
  const peers = readPeers(layout);
  const full = fullMask(layout);
  const masks = grid.map((digit, index) => {
    if (digit !== 0) {
      return peers[index].some((peer) => grid[peer] === digit) ? 0 : toBit(digit);
    }
    const used = peers[index].reduce(
      (mask, peer) => (grid[peer] === 0 ? mask : mask | toBit(grid[peer])),
      0,
    );
    return full & ~used;
  });
  return masks.some((mask) => mask === 0) ? null : masks;
}

interface SearchState {
  layout: Layout;
  grid: number[];
  random: Random | null;
  limit: number;
  found: number;
  first: number[] | null;
}

function pickEmptyCell(state: SearchState): { index: number; mask: number } | null {
  const masks = computeCandidates(state.layout, state.grid);
  if (masks === null) {
    return { index: -1, mask: 0 };
  }
  const empties = state.grid
    .map((digit, index) => ({ digit, index, count: listDigits(masks[index]).length }))
    .filter((cell) => cell.digit === 0);
  if (empties.length === 0) {
    return null;
  }
  const best = empties.reduce((winner, cell) => (cell.count < winner.count ? cell : winner));
  return { index: best.index, mask: masks[best.index] };
}

function search(state: SearchState): void {
  const target = pickEmptyCell(state);
  if (target === null) {
    state.found += 1;
    state.first = state.first ?? [...state.grid];
    return;
  }
  if (target.index < 0) {
    return;
  }
  const digits = state.random
    ? shuffle(listDigits(target.mask), state.random)
    : listDigits(target.mask);
  digits.forEach((digit) => {
    if (state.found < state.limit) {
      state.grid[target.index] = digit;
      search(state);
      state.grid[target.index] = 0;
    }
  });
}

function runSearch(layout: Layout, grid: readonly number[], limit: number, random: Random | null) {
  const state: SearchState = { layout, grid: [...grid], random, limit, found: 0, first: null };
  search(state);
  return state;
}

export function countSolutions(layout: Layout, grid: readonly number[], limit = 2): number {
  return runSearch(layout, grid, limit, null).found;
}

export function solveGrid(
  layout: Layout,
  grid: readonly number[],
  random: Random | null = null,
): number[] | null {
  return runSearch(layout, grid, 1, random).first;
}
