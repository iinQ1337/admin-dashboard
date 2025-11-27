import { Activity, Server, WifiOff } from "lucide-react";

import { AnimatedSection } from "@/components/dashboard/animated-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createTranslator, formatDateTime } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n-server";
import { loadQueueMonitoringData } from "@/lib/queues";

export default async function QueuesPage() {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  const data = await loadQueueMonitoringData();
  const updatedAt = formatDateTime(data.generatedAt, locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <DashboardShell>
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-background">
        <AnimatedSection className="container space-y-8 py-10">
          <header className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">{t("Очереди", "Queues")}</p>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Queue Monitoring</h1>
                <p className="text-muted-foreground">
                  {t("Redis / RabbitMQ доступность. Обновлено", "Redis / RabbitMQ availability. Updated")} {updatedAt}
                </p>
              </div>
              <StatusBadge tone="info" className="w-fit">
                {data.summary.total} {t("очередей", "queues")} · {data.summary.down} {t("недоступны", "down")}
              </StatusBadge>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<Server className="h-4 w-4 text-primary" />}
              label={t("Всего очередей", "Total queues")}
              value={data.summary.total}
              helper={`${data.summary.up} ${t("в работе", "operational")}`}
            />
            <SummaryCard
              icon={<Activity className="h-4 w-4 text-primary" />}
              label={t("Доступны", "Up")}
              value={data.summary.up}
              helper={t("Последний пинг", "Last ping")}
            />
            <SummaryCard
              icon={<WifiOff className="h-4 w-4 text-primary" />}
              label={t("Недоступны", "Down")}
              value={data.summary.down}
              helper={t("Требуют внимания", "Needs attention")}
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>{t("Очереди", "Queues")}</CardTitle>
              <CardDescription>{t("TCP доступность и ответ PING для Redis", "TCP availability and PING for Redis")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="px-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Имя", "Name")}</TableHead>
                    <TableHead>{t("Тип", "Type")}</TableHead>
                    <TableHead>{t("Хост", "Host")}</TableHead>
                    <TableHead>{t("Статус", "Status")}</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>{t("Сообщение", "Message")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.queues.map((queue) => (
                    <TableRow key={queue.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{queue.name}</p>
                          <p className="text-xs text-muted-foreground">{queue.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{queue.type}</TableCell>
                      <TableCell>
                        {queue.host}:{queue.port}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={queue.status === "up" ? "success" : "danger"}>
                          {queue.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {queue.latencyMs} {t("мс", "ms")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{queue.message || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!data.queues.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        {t("Очереди не сконфигурированы", "Queues are not configured")}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </AnimatedSection>
      </main>
    </DashboardShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card className="transition duration-300 hover:border-primary/50 hover:shadow-lg">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-border/80 bg-card/80 p-2">{icon}</div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
