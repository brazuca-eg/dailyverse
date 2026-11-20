import { formatElapsed } from "../../core/elapsed";
import type { SwitchbackState } from "./game";
import { t } from "./messages";
import { gameMeta } from "./meta";

export function buildShareText(
  state: SwitchbackState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const lines = [
    `Dailyverse ${gameMeta("meta.switch.title")} #${puzzleNumber} · ${t("switch.share.detail", {
      size,
      result: state.status === "won" ? t("switch.share.won") : t("switch.share.lost"),
    })}`,
    t("switch.share.stats", {
      time: formatElapsed(state.elapsedSeconds),
      hints: t("switch.share.hints", { count: state.hints }),
    }),
  ];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
