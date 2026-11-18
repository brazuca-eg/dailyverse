import type { Random } from "../../core/random";
import { areAdjacent, listNeighbours } from "./grid";

function buildSerpentine(size: number): number[] {
  return Array.from({ length: size * size }, (_, step) => {
    const row = Math.floor(step / size);
    const offset = step % size;
    return row * size + (row % 2 === 0 ? offset : size - 1 - offset);
  });
}

function backbite(path: readonly number[], size: number, random: Random): number[] {
  const tail = path[path.length - 1];
  const options = listNeighbours(size, tail).filter((cell) => cell !== path[path.length - 2]);
  const target = options[Math.floor(random() * options.length)];
  const at = path.indexOf(target);
  return [...path.slice(0, at + 1), ...path.slice(at + 1).reverse()];
}

export function randomHamiltonianPath(size: number, random: Random): number[] {
  const rounds = size * size * 20;
  return Array.from({ length: rounds }).reduce<number[]>(
    (path) =>
      random() < 0.5
        ? backbite(path, size, random)
        : backbite([...path].reverse(), size, random).reverse(),
    buildSerpentine(size),
  );
}

export function isHamiltonianPath(size: number, path: readonly number[]): boolean {
  const cells = size * size;
  return (
    path.length === cells &&
    new Set(path).size === cells &&
    path.every(
      (cell, step) =>
        cell >= 0 && cell < cells && (step === 0 || areAdjacent(size, path[step - 1], cell)),
    )
  );
}
