import type { ReactNode } from "react";
import Link from "next/link";

import { Activity, Database, HardDrive, ShieldAlert } from "lucide-react";

import { AnimatedSection } from "@/components/dashboard/animated-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type DatabaseAlert,
  type DatabaseBackupJob,
  loadDatabaseMonitoringData
} from "@/lib/databases";
import { createTranslator, formatDateTime, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n-server";
import { InstancesTable } from "@/components/databases/instances-table";

const ALERT_TONES: Record<DatabaseAlert["severity"], StatusTone> = {
  info: "info",
  warning: "warning",
  critical: "danger"
};

const BACKUP_STATUS_LABEL: Record<DatabaseBackupJob["status"], string> = {
  success: "успешно",
  running: "в процессе",
  failed: "ошибка"
};

export default async function DatabasesPage() {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  const data = await loadDatabaseMonitoringData();
  const updatedAt = formatDateTime(data.generatedAt, locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <DashboardShell>
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-background">
        <AnimatedSection className="container space-y-8 py-10">
          <header className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">{t("Мониторинг БД", "Database monitoring")}</p>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("Базы данных", "Databases")}</h1>
                <p className="text-muted-foreground">
                  {t("Репликация, задержки чтения и расписания бэкапов. Обновлено", "Replication, read lag, and backup schedules. Updated")}{" "}
                  {updatedAt}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone="info" className="w-fit">
                  {data.summary.totalClusters} {t("кластера", "clusters")} · {data.summary.criticalAlerts}{" "}
                  {t("критических событий", "critical alerts")}
                </StatusBadge>
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings?tab=supervisor">{t("Настройки базы данных", "Database settings")}</Link>
                </Button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={<Database className="h-4 w-4 text-primary" />}
              label={t("Кластеров под контролем", "Clusters under control")}
              value={data.summary.totalClusters}
              helper={`${data.summary.healthyClusters} ${t("в норме", "healthy")}`}
              href="#db-instances"
            />
            <SummaryCard
              icon={<Activity className="h-4 w-4 text-primary" />}
              label={t("Средняя задержка репликации", "Avg replication lag")}
              value={`${data.summary.avgReplicationLagMs} ${t("мс", "ms")}`}
              helper={t("Порог — 200 мс", "Threshold — 200 ms")}
              href="#db-instances"
            />
            <SummaryCard
              icon={<ShieldAlert className="h-4 w-4 text-primary" />}
              label={t("Обострений", "Incidents")}
              value={data.summary.criticalAlerts}
              helper={`${data.summary.degradedClusters} ${t("кластера требуют внимания", "clusters need attention")}`}
              href="#db-alerts"
            />
            <SummaryCard
              icon={<HardDrive className="h-4 w-4 text-primary" />}
              label={t("Нагрузка на хранилище", "Storage pressure")}
              value={`${data.summary.storagePressurePercent}%`}
              helper={t("Среднее по всем инстансам", "Average across instances")}
              href="#db-backups"
            />
          </section>

          <section className="space-y-6">
            <div id="db-instances">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Инстансы", "Instances")}</CardTitle>
                  <CardDescription>{t("Покрытие по регионам, роли и хранению", "Regions, roles, and storage coverage")}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <InstancesTable instances={data.instances} locale={locale} />
                </CardContent>
              </Card>
            </div>

            <div id="db-alerts">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Алармы", "Alarms")}</CardTitle>
                  <CardDescription>{t("Последние сообщения от RDS/ClickHouse", "Latest RDS/ClickHouse messages")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{alert.cluster}</p>
                        <StatusBadge tone={ALERT_TONES[alert.severity]}>{alert.severity}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatTimestamp(alert.createdAt, locale)}
                      </p>
                    </div>
                  ))}
                  {!data.alerts.length ? <p className="text-sm text-muted-foreground">{t("Событий нет", "No alerts")}</p> : null}
                </CardContent>
              </Card>
            </div>

            <div id="db-backups">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Бэкапы", "Backups")}</CardTitle>
                  <CardDescription>{t("Статус последних запусков", "Latest run status")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {data.backups.map((backup) => (
                    <div key={backup.id} className="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 p-3">
                      <div>
                        <p className="font-medium">{backup.target}</p>
                        <p className="text-xs text-muted-foreground">{backup.schedule}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("Последний запуск", "Last run")} · {formatTimestamp(backup.lastRun, locale)}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <StatusBadge tone={getBackupTone(backup.status)}>
                          {BACKUP_STATUS_LABEL[backup.status]}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
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
              <Badge className="w-fit border-none bg-muted/50 text-xs text-muted-foreground">
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

function formatTimestamp(value: string, locale: Locale) {
  return formatDateTime(value, locale, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  });
}

function getBackupTone(status: DatabaseBackupJob["status"]): StatusTone {
  if (status === "success") return "success";
  if (status === "running") return "info";
  return "danger";
}
