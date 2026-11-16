export interface ClipboardLike {
  writeText(text: string): Promise<void>;
}

function getBrowserClipboard(): ClipboardLike | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.clipboard;
}

export async function copyTextToClipboard(
  text: string,
  clipboard: ClipboardLike | undefined = getBrowserClipboard(),
): Promise<boolean> {
  if (!clipboard) {
    return false;
  }
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
