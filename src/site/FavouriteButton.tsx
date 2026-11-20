import { useState } from "react";
import { isFavourite, toggleFavourite } from "../core/favourites";
import { siteMessages as t } from "../i18n/site";
import { STAR_PATH } from "./starIcon";
import "./FavouriteButton.css";

interface FavouriteButtonProps {
  slug: string;
}

export function FavouriteButton({ slug }: FavouriteButtonProps) {
  const [isOn, setIsOn] = useState(() => isFavourite(slug));

  function handleClick() {
    setIsOn(toggleFavourite(slug).includes(slug));
  }

  return (
    <button type="button" className="fav-button" aria-pressed={isOn} onClick={handleClick}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
      <span>{isOn ? t("site.fav.active") : t("site.fav.add")}</span>
    </button>
  );
}
