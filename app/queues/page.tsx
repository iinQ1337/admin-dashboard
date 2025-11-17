import { Activity, Server, WifiOff } from "lucide-react";

import { AnimatedSection } from "@/components/dashboard/animated-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadQueueMonitoringData } from "@/lib/queues";

export default async function QueuesPage() {
  const data = await loadQueueMonitoringData();
  const updatedAt = new Date(data.generatedAt).toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <DashboardShell>
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-background">
        <AnimatedSection className="container space-y-8 py-10">
          <header className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Очереди</p>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Queue Monitoring</h1>
                <p className="text-muted-foreground">Redis / RabbitMQ доступность. Обновлено {updatedAt}</p>
              </div>
              <StatusBadge tone="info" className="w-fit">
                {data.summary.total} очередей · {data.summary.down} недоступны
              </StatusBadge>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<Server className="h-4 w-4 text-primary" />}
              label="Всего очередей"
              value={data.summary.total}
              helper={`${data.summary.up} в работе`}
            />
            <SummaryCard
              icon={<Activity className="h-4 w-4 text-primary" />}
              label="Доступны"
              value={data.summary.up}
              helper="Последний пинг"
            />
            <SummaryCard
              icon={<WifiOff className="h-4 w-4 text-primary" />}
              label="Недоступны"
              value={data.summary.down}
              helper="Требуют внимания"
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Очереди</CardTitle>
              <CardDescription>TCP доступность и ответ PING для Redis</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="px-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Хост</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Сообщение</TableHead>
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
                      <TableCell>{queue.latencyMs} мс</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{queue.message || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!data.queues.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        Очереди не сконфигурированы
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
