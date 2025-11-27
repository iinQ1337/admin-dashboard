export type Locale = "ru" | "en";

export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "dashboard_locale";

export function localeToIntl(locale: Locale): "ru-RU" | "en-US" {
  return locale === "en" ? "en-US" : "ru-RU";
}

export function formatDateTime(
  value: string | number | Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
) {
  try {
    return new Date(value).toLocaleString(localeToIntl(locale), options);
  } catch {
    return String(value);
  }
}

export function createTranslator(locale: Locale) {
  return function translate(ru: string, en: string) {
    return locale === "en" ? en : ru;
  };
}
