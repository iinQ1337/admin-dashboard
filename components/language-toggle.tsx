"use client";

import { Languages } from "lucide-react";

import { useLanguage, useTranslations } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const t = useTranslations();

  const handleChange = (value: string) => {
    if (value === "ru" || value === "en") {
      setLocale(value as Locale);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 rounded-full border border-border/80 px-4">
          <Languages className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("Язык интерфейса", "Interface language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
          <DropdownMenuRadioItem value="ru">Русский</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
