import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./i18n";

export function resolveLocale(): Locale {
  try {
    const cookieValue = cookies().get(LOCALE_COOKIE)?.value;
    if (cookieValue === "en" || cookieValue === "ru") {
      return cookieValue;
    }
  } catch {
    // ignore and fallback
  }
  return DEFAULT_LOCALE;
}
