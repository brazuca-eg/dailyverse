import { formatElapsed } from "../../core/elapsed";
import { countEncounters, type BearState } from "./game";
import { t } from "./messages";
import { gameMeta } from "./meta";

export function buildShareText(
  state: BearState,
  size: number,
  puzzleNumber: number,
  url?: string,
): string {
  const lines = [
    `${t("bear.share.header", {
      title: gameMeta("meta.bear.title"),
      number: puzzleNumber,
    })} · ${size}x${size} · ⏱ ${formatElapsed(state.elapsedSeconds)} · ${t(state.status === "won" ? "bear.share.won" : "bear.share.lost")}`,
    `🐻 ${t("bear.share.encounters", { count: countEncounters(state) })} · 💡 ${t("bear.share.hints", { count: state.hints })}`,
  ];
  return [...lines, ...(url ? [url] : [])].join("\n");
}
