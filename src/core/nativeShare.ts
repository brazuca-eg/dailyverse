export type ShareOutcome = "shared" | "cancelled" | "failed" | "unsupported";

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export interface Sharer {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

function getBrowserSharer(): Sharer | undefined {
  return typeof navigator === "undefined" ? undefined : navigator;
}

export function splitShareUrl(text: string): { text: string; url: string | null } {
  const lines = text.split("\n");
  const last = lines[lines.length - 1] ?? "";
  return /^https?:\/\/\S+$/.test(last.trim())
    ? { text: lines.slice(0, -1).join("\n").trimEnd(), url: last.trim() }
    : { text, url: null };
}

export async function shareNatively(
  data: ShareData,
  sharer: Sharer | undefined = getBrowserSharer(),
): Promise<ShareOutcome> {
  if (!sharer?.share || (sharer.canShare && !sharer.canShare(data))) {
    return "unsupported";
  }
  try {
    await sharer.share(data);
    return "shared";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "failed";
  }
}
