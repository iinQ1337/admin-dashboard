import { AlertTriangle, FolderDot, ShieldCheck, ShieldX } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SensitivePathsCheck } from "@/lib/report";
import { formatNumber } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export function SensitivePathsPanel({ data }: { data: SensitivePathsCheck }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Чувствительные директории</CardTitle>
          <CardDescription>Проверки на доступ к .env, конфигам и служебным файлам</CardDescription>
        </div>
        <StatusBadge tone={data.exposed ? "danger" : "success"} className="gap-1 text-xs uppercase">
          {data.exposed ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5" /> Обнаружено: {data.exposed}
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5" /> Всё закрыто
            </>
          )}
        </StatusBadge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Всего" value={data.total_checked} />
          <Stat label="Обнаружено" value={data.exposed} />
          <Stat label="Ошибок" value={data.errors} />
        </div>
        <ScrollArea className="h-[260px] pr-4">
          <div className="space-y-3">
            {data.results.map((item) => (
              <div key={item.url} className="rounded-xl border bg-card/60 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.path}</p>
                    <p className="text-xs text-muted-foreground">{item.base_url}</p>
                  </div>
                  <StatusBadge tone={item.exposed ? "danger" : "info"} className="gap-1 text-xs uppercase">
                    {item.exposed ? (
                      <>
                        <ShieldX className="h-3.5 w-3.5" /> Доступен
                      </>
                    ) : (
                      <>
                        <FolderDot className="h-3.5 w-3.5" /> Скрыт
                      </>
                    )}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Статус: {item.status ?? "—"} · {item.url}
                </p>
                {item.error ? <p className="mt-1 text-xs text-destructive">Ошибка: {item.error}</p> : null}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card/50 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{formatNumber(value, 0)}</p>
    </div>
  );
}
