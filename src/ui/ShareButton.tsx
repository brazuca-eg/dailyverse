import { useEffect, useRef, useState } from "react";
import { copyTextToClipboard } from "../core/clipboard";
import { CheckIcon, ShareIcon } from "./icons";

interface ShareButtonProps {
  text: string;
}

type CopyStatus = "idle" | "copied" | "failed";

const STATUS_RESET_MS = 2000;

const STATUS_LABELS: Record<CopyStatus, string> = {
  idle: "Share result",
  copied: "Copied to clipboard",
  failed: "Couldn't copy. Select the text above",
};

export function ShareButton({ text }: ShareButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function handleClick() {
    const copied = await copyTextToClipboard(text);
    setStatus(copied ? "copied" : "failed");
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setStatus("idle"), STATUS_RESET_MS);
  }

  return (
    <button type="button" className="button button-primary button-block" onClick={handleClick}>
      {status === "copied" ? <CheckIcon size={20} /> : <ShareIcon size={20} />}
      <span aria-live="polite">{STATUS_LABELS[status]}</span>
    </button>
  );
}
