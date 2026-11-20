import { useState } from "react";
import { loadFavourites } from "../core/favourites";
import { buildLocalePath, readCurrentLocale, splitLocalePath } from "../i18n/locales";
import { siteMessages } from "../i18n/site";
import { Modal } from "../ui/Modal";
import { SITE_GAMES, listGameGroups, listGroupGames } from "./games";
import { LanguagePicker } from "./LanguagePicker";
import { ThemePicker } from "./ThemePicker";
import "./SiteMenu.css";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function SiteMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const locale = readCurrentLocale();
  const { path: currentPath } = splitLocalePath(window.location.pathname);
  const label = siteMessages("site.menu.open");
  const favourites = isOpen
    ? loadFavourites().flatMap((slug) => SITE_GAMES.filter((game) => game.slug === slug))
    : [];

  return (
    <>
      <button type="button" className="menu-button" onClick={() => setIsOpen(true)}>
        <MenuIcon />
        <span>{label}</span>
      </button>
      <Modal open={isOpen} title={siteMessages("site.menu.title")} onClose={() => setIsOpen(false)}>
        <div className="menu-settings">
          <ThemePicker />
          <LanguagePicker />
        </div>
        <nav className="menu-nav" aria-label={siteMessages("site.menu.games")}>
          <div className="menu-quick">
            <a
              className="menu-home"
              href={buildLocalePath(locale)}
              aria-current={currentPath === "" ? "page" : undefined}
            >
              {siteMessages("site.menu.home")}
            </a>
            <a
              className="menu-home"
              href={buildLocalePath(locale, "stats")}
              aria-current={currentPath === "stats" ? "page" : undefined}
            >
              {siteMessages("site.menu.stats")}
            </a>
          </div>
          {favourites.length > 0 && (
            <section className="menu-section">
              <h3 className="menu-heading">{siteMessages("site.fav.title")}</h3>
              <ul className="menu-games">
                {favourites.map((game) => (
                  <li key={game.slug}>
                    <a
                      className="menu-game"
                      href={buildLocalePath(locale, game.slug)}
                      aria-current={currentPath === game.slug ? "page" : undefined}
                    >
                      {game.readMeta(locale, "title")}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {listGameGroups().map((group) => (
            <section key={group.id} className="menu-section">
              <h3 className="menu-heading">{siteMessages(`site.group.${group.id}.name`)}</h3>
              <ul className="menu-games">
                {listGroupGames(group).map((game) => (
                  <li key={game.slug}>
                    <a
                      className="menu-game"
                      href={buildLocalePath(locale, game.slug)}
                      aria-current={currentPath === game.slug ? "page" : undefined}
                    >
                      {game.readMeta(locale, "title")}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </Modal>
    </>
  );
}
