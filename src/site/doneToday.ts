import { isDoneToday } from "../core/doneToday";

export function showDoneMarks(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-done-game]").forEach((mark) => {
    mark.hidden = !isDoneToday(mark.dataset.doneGame ?? "");
  });
}
