export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function containsWholeWord(text: string, word: string): boolean {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(foldText(word))}($|[^a-z0-9])`);
  return pattern.test(foldText(text));
}
