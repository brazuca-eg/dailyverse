import type { Binding, Item } from "./items";

function toLetters(index: number): string {
  const first = String.fromCharCode(97 + Math.floor(index / 26));
  return `${first}${String.fromCharCode(97 + (index % 26))}`;
}

export function makeItems(count: number, growth = 1.04): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `Peak ${toLetters(index)}`,
    value: Math.round(100 * growth ** index),
    editions: 300 - index,
  }));
}

export function makeBindings(count: number, growth = 1.04, factor = 1): Binding[] {
  return makeItems(count, growth).map((item, index) => ({
    id: `Q${1000 + index}`,
    name: item.name,
    value: item.value / factor,
    links: item.editions + 20,
  }));
}
