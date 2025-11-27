"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createTranslator, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof createTranslator>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLocale,
  children
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  const setLocale = (value: Locale) => {
    setLocaleState(value);
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    document.cookie = `${LOCALE_COOKIE}=${value}; path=/; expires=${expiry.toUTCString()}`;
    router.refresh();
  };

  const t = useMemo(() => createTranslator(locale), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t
    }),
    [locale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

export function useTranslations() {
  const { locale } = useLanguage();
  return useMemo(() => createTranslator(locale), [locale]);
}
