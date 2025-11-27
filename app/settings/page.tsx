import Link from "next/link";

import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n-server";

export default function SettingsPage({ searchParams }: { searchParams?: { tab?: string } }) {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  return (
    <main className="container space-y-6 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{t("Настройки", "Settings")}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("Интеграции и опросы", "Integrations and polling")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "Эти параметры готовят значения для config.yaml и секретов. Сама запись выполняется сервисом или через CLI.",
              "These parameters prepare values for config.yaml and secrets. Writing happens via the service or CLI."
            )}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">{t("Назад к панели", "Back to dashboard")}</Link>
        </Button>
      </div>
      <SettingsForm initialTab={searchParams?.tab} />
    </main>
  );
}
