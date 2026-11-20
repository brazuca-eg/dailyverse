import { useEffect, useRef, useState } from "react";
import { copyTextToClipboard } from "../core/clipboard";
import { isTouchDevice } from "../core/device";
import { shareNatively, splitShareUrl } from "../core/nativeShare";
import { CheckIcon, ShareIcon } from "./icons";
import { uiMessages as t } from "./messages";

interface ShareButtonProps {
  text: string;
  idleLabel?: string;
}

type CopyStatus = "idle" | "copied" | "failed";

const STATUS_RESET_MS = 2000;

const STATUS_KEYS = {
  idle: "ui.share.idle",
  copied: "ui.share.copied",
  failed: "ui.share.failed",
} as const satisfies Record<CopyStatus, string>;

export function ShareButton({ text, idleLabel }: ShareButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function handleClick() {
    if (isTouchDevice()) {
      const { text: body, url } = splitShareUrl(text);
      const outcome = await shareNatively({
        title: body.split("\n")[0],
        text: body,
        ...(url ? { url } : {}),
      });
      if (outcome === "shared" || outcome === "cancelled") {
        return;
      }
    }
    const copied = await copyTextToClipboard(text);
    setStatus(copied ? "copied" : "failed");
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setStatus("idle"), STATUS_RESET_MS);
  }

  return (
    <button type="button" className="button button-primary button-block" onClick={handleClick}>
      {status === "copied" ? <CheckIcon size={20} /> : <ShareIcon size={20} />}
      <span aria-live="polite">
        {status === "idle" && idleLabel ? idleLabel : t(STATUS_KEYS[status])}
      </span>
    </button>
  );
}
