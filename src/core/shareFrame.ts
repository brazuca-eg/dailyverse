import { splitShareUrl } from "./nativeShare";

export interface ShareFrame {
  streakLine: string | null;
  callLine: string;
}

export function frameShareText(text: string, frame: ShareFrame): string {
  const { text: body, url } = splitShareUrl(text);
  const lines = [body, ...(frame.streakLine ? [frame.streakLine] : []), frame.callLine];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
