import { readCurrentLocale } from "../../i18n/locales";
import { t } from "./messages";

export function EnglishWordsNote() {
  if (readCurrentLocale() === "en") {
    return null;
  }
  return <p className="trail-note">{t("words.note.english")}</p>;
}
