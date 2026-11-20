import { loadFavourites, toggleFavourite } from "../core/favourites";
import { showDoneMarks } from "./doneToday";

function findSourceItem(root: ParentNode, slug: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `.home-group:not(#favourites) li[data-game-slug="${slug}"]`,
  );
}

function updateToggles(root: ParentNode, favourites: readonly string[]) {
  root.querySelectorAll<HTMLButtonElement>("[data-fav-slug]").forEach((button) => {
    const isOn = favourites.includes(button.dataset.favSlug ?? "");
    button.hidden = false;
    button.setAttribute("aria-pressed", String(isOn));
    button.setAttribute(
      "aria-label",
      (isOn ? button.dataset.labelRemove : button.dataset.labelAdd) ?? "",
    );
  });
}

export function syncFavourites(root: ParentNode = document, favourites = loadFavourites()) {
  const section = root.querySelector<HTMLElement>("#favourites");
  const list = root.querySelector<HTMLElement>("#favourites-list");
  if (section && list) {
    const items = favourites
      .map((slug) => findSourceItem(root, slug))
      .filter((item): item is HTMLElement => item !== null)
      .map((item) => item.cloneNode(true) as HTMLElement);
    list.replaceChildren(...items);
    section.hidden = items.length === 0;
  }
  updateToggles(root, favourites);
  showDoneMarks(root);
}

export function initFavourites(root: Document = document): () => void {
  syncFavourites(root);
  const handleClick = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("[data-fav-slug]");
    if (button) {
      syncFavourites(root, toggleFavourite(button.dataset.favSlug ?? ""));
    }
  };
  root.addEventListener("click", handleClick);
  return () => root.removeEventListener("click", handleClick);
}
