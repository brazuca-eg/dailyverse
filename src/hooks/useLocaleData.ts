import { useEffect, useState } from "react";
import { readCurrentLocale, type Locale } from "../i18n/locales";

export function useLocaleData<T>(load: (locale: Locale) => Promise<T | null>): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let isCurrent = true;
    load(readCurrentLocale()).then((loaded) => {
      if (isCurrent) {
        setData(loaded);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [load]);

  return data;
}
