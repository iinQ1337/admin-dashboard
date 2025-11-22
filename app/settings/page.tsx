import Link from "next/link";

import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";

export default function SettingsPage({ searchParams }: { searchParams?: { tab?: string } }) {
  return (
    <main className="container space-y-6 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Настройки</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Интеграции и опросы</h1>
          <p className="text-sm text-muted-foreground">
            Эти параметры готовят значения для config.yaml и секретов. Сама запись выполняется сервисом или через CLI.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Назад к панели</Link>
        </Button>
      </div>
      <SettingsForm initialTab={searchParams?.tab} />
    </main>
  );
}
