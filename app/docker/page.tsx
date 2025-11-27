import type { ReactNode } from "react";
import Link from "next/link";

import { AlertCircle, Boxes, Cpu, Server } from "lucide-react";

import { AnimatedSection } from "@/components/dashboard/animated-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ContainerTable } from "@/components/docker/container-table";
import { type DockerEvent, type DockerNode, loadDockerMonitoringData } from "@/lib/docker";
import { createTranslator, formatDateTime } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n-server";

const NODE_STATUS_TONE: Record<DockerNode["status"], StatusTone> = {
  online: "success",
  drain: "warning",
  offline: "danger"
};

const EVENT_TONE: Record<DockerEvent["type"], StatusTone> = {
  info: "info",
  warning: "warning",
  error: "danger"
};

export default async function DockerPage() {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  const data = await loadDockerMonitoringData();
  const updatedAt = formatDateTime(data.generatedAt, locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <DashboardShell>
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-background">
        <AnimatedSection className="container space-y-8 py-10">
          <header className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">{t("Инфраструктура", "Infrastructure")}</p>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Docker / Orchestration</h1>
                <p className="text-muted-foreground">
                  {t("Контейнеры, Swarm-узлы и события кластера. Обновлено", "Containers, Swarm nodes, and cluster events. Updated")}{" "}
                  {updatedAt}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone="info" className="w-fit">
                  {data.summary.runningContainers} {t("активных контейнеров", "running containers")}
                </StatusBadge>
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings?tab=supervisor">{t("Настройки докера", "Docker settings")}</Link>
                </Button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={<Boxes className="h-4 w-4 text-primary" />}
              label={t("Работает контейнеров", "Running containers")}
              value={data.summary.runningContainers}
              helper={`${data.summary.unhealthyContainers} ${t("требуют внимания", "need attention")}`}
              href="#docker-containers"
            />
            <SummaryCard
              icon={<Cpu className="h-4 w-4 text-primary" />}
              label={t("Средняя загрузка CPU", "Average CPU usage")}
              value={`${data.summary.avgCpuUsage}%`}
              helper={t("За последние 10 мин", "Last 10 minutes")}
              href="#docker-containers"
            />
            <SummaryCard
              icon={<Server className="h-4 w-4 text-primary" />}
              label={t("Узлов онлайн", "Nodes online")}
              value={data.nodes.filter((node) => node.status === "online").length}
              helper={`${data.nodes.length} ${t("в кластере", "in cluster")}`}
              href="#docker-nodes"
            />
            <SummaryCard
              icon={<AlertCircle className="h-4 w-4 text-primary" />}
              label={t("Событий", "Events")}
              value={data.summary.warningCount}
              helper={t("Только предупреждения и ошибки", "Warnings and errors only")}
              href="#docker-events"
            />
          </section>

          <section className="space-y-6">
            <div id="docker-containers">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Контейнеры", "Containers")}</CardTitle>
                  <CardDescription>{t("Здоровье сервисов и использование ресурсов", "Service health and resource usage")}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ContainerTable containers={data.containers} events={data.events} />
                </CardContent>
              </Card>
            </div>

            <div id="docker-nodes">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Узлы", "Nodes")}</CardTitle>
                  <CardDescription>{t(" Swarm / Kubernetes-воркеров", "Swarm / Kubernetes workers status")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.nodes.map((node) => (
                    <div key={node.id} className="rounded-2xl border border-border/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{node.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {node.role} · Docker {node.dockerVersion}
                          </p>
                        </div>
                        <StatusBadge tone={NODE_STATUS_TONE[node.status]}>{node.status}</StatusBadge>
                      </div>
                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                        <Metric label="CPU" value={`${node.cpuUsage}%`} percent={node.cpuUsage} />
                        <Metric
                          label={t("Память", "Memory")}
                          value={`${node.memoryUsageGb} / ${node.memoryCapacityGb} ${t("ГБ", "GB")}`}
                          percent={Math.round((node.memoryUsageGb / node.memoryCapacityGb) * 100)}
                        />
                        <p>
                          {t("Контейнеров", "Containers")}: {node.runningContainers}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div id="docker-events">
              <Card>
                <CardHeader>
                  <CardTitle>{t("События", "Events")}</CardTitle>
                  <CardDescription>{t("Последние операции и алерты", "Recent operations and alerts")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {data.events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 rounded-2xl bg-muted/40 p-3">
                      <StatusBadge tone={EVENT_TONE[event.type]} className="mt-1">
                        {event.type}
                      </StatusBadge>
                      <div>
                        <p className="text-sm font-medium">{event.scope}</p>
                        <p className="text-sm text-muted-foreground">{event.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(event.timestamp, locale)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!data.events.length ? (
                    <p className="text-sm text-muted-foreground">{t("Активных событий нет", "No active events")}</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </section>
        </AnimatedSection>
      </main>
    </DashboardShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  href
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
  href?: string;
}) {
  const card = (
    <Card className="transition duration-300 hover:border-primary/50 hover:shadow-lg">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-border/80 bg-card/80 p-2">{icon}</div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
        <p className="text-3xl font-semibold">{value}</p>
        <Badge variant="outline" className="w-fit border-dashed text-xs text-muted-foreground">
          {helper}
        </Badge>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {card}
      </a>
    );
  }

  return card;
}

function Metric({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Progress value={percent} className="mt-1" />
    </div>
  );
}

function formatTimestamp(value: string, locale: ReturnType<typeof resolveLocale>) {
  return formatDateTime(value, locale, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  });
}
