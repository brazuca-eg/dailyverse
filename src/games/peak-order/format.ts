import { readCurrentLocale } from "../../i18n/locales";
import type { CategoryId } from "./categories";
import { peakMessages as t } from "./messages";

export function formatValue(value: number, category: CategoryId): string {
  return t(`peak.value.${category}`, {
    value: new Intl.NumberFormat(readCurrentLocale()).format(value),
  });
}

export function buildPrompt(category: CategoryId): string {
  return t(`peak.prompt.${category}`);
}
