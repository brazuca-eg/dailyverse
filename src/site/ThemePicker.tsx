import { useState } from "react";
import { siteMessages } from "../i18n/site";
import {
  THEME_CHOICES,
  applyThemeChoice,
  readThemeChoice,
  saveThemeChoice,
  type ThemeChoice,
} from "../theme/theme";

export function ThemePicker() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice());

  function handleChange(next: ThemeChoice) {
    setChoice(next);
    saveThemeChoice(next);
    applyThemeChoice(next);
  }

  return (
    <fieldset className="menu-segmented">
      <legend className="menu-heading">{siteMessages("site.settings.theme")}</legend>
      <div className="menu-segmented-options">
        {THEME_CHOICES.map((option) => (
          <label key={option} className="menu-segment">
            <input
              type="radio"
              name="theme"
              value={option}
              checked={choice === option}
              onChange={() => handleChange(option)}
            />
            <span>{siteMessages(`site.theme.${option}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
