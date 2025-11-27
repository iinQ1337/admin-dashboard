"use client";

import { useMemo } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { useTranslations } from "@/components/language-provider";

export function GlobalToolbar() {
  const t = useTranslations();
  const ariaLabel = useMemo(
    () => t("Глобальные переключатели темы и языка", "Global theme and language toggles"),
    [t]
  );

  return (
    <div
      className="fixed right-5 top-4 z-50 flex items-center gap-4 rounded-full border border-border/70 bg-card/80 px-1 py-1 shadow-lg backdrop-blur"
      aria-label={ariaLabel}
    >
      <LanguageToggle />
      <ModeToggle />
    </div>
  );
}
