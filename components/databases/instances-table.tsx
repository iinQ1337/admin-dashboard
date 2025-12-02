"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Info, X } from "lucide-react";

import { useLanguage, useTranslations } from "@/components/language-provider";
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DatabaseInstance } from "@/lib/databases";
import { localeToIntl, type Locale } from "@/lib/i18n";

const STATUS_TONES: Record<DatabaseInstance["status"], StatusTone> = {
  healthy: "success",
  degraded: "warning",
  critical: "danger",
  maintenance: "info"
};

const STATUS_LABELS: Record<DatabaseInstance["status"], { ru: string; en: string }> = {
  healthy: { ru: "В норме", en: "Healthy" },
  degraded: { ru: "Замедление", en: "Degraded" },
  critical: { ru: "Авария", en: "Critical" },
  maintenance: { ru: "Обслуживание", en: "Maintenance" }
};

type Props = {
  instances: DatabaseInstance[];
  locale?: Locale;
};

export function InstancesTable({ instances, locale }: Props) {
  const { locale: ctxLocale } = useLanguage();
  const t = useTranslations();
  const intlLocale = localeToIntl(locale ?? ctxLocale);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => instances.find((item) => item.id === selectedId) ?? null,
    [instances, selectedId]
  );

  return (
    <>
      <Table className="px-4">
        <TableHeader>
          <TableRow>
            <TableHead>{t("Кластер", "Cluster")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("Роль", "Role")}</TableHead>
            <TableHead>{t("", "")}</TableHead>
            <TableHead className="hidden xl:table-cell">P95, {t("мс", "ms")}</TableHead>
            <TableHead>QPS</TableHead>
            <TableHead className="hidden xl:table-cell">Lag, {t("мс", "ms")}</TableHead>
            <TableHead>{t("Хранилище", "Storage")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instances.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                {t("Нет данных по инстансам. Подождите обновления из сервиса или проверьте конфиг.", "No instances yet. Wait for the next refresh or check the config.")}
              </TableCell>
            </TableRow>
          ) : (
            instances.map((instance) => (
              <TableRow
                key={instance.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(instance.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(instance.id);
                  }
                }}
                className="cursor-pointer transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{instance.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {instance.engine} {instance.version} · {instance.region}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge className="capitalize border-none bg-muted/60 text-muted-foreground">
                    {instance.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={STATUS_TONES[instance.status]}>
                    {t(STATUS_LABELS[instance.status].ru, STATUS_LABELS[instance.status].en)}
                  </StatusBadge>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {instance.latencyMsP95} {t("мс", "ms")}
                </TableCell>
                <TableCell>{instance.queriesPerSecond.toLocaleString(intlLocale)}</TableCell>
                <TableCell className="hidden xl:table-cell">
                  {instance.replicationLagMs} {t("мс", "ms")}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={instance.storageUsagePercent} />
                    <p className="text-xs text-muted-foreground">
                      {instance.storageUsedGb} {t("из", "of")} {instance.storageTotalGb} {t("ГБ", "GB")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <InstanceModal
        instance={selected}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

function InstanceModal({
  instance,
  onClose
}: {
  instance: DatabaseInstance | null;
  onClose: () => void;
}) {
  if (!instance) return null;
  const { locale } = useLanguage();
  const intlLocale = localeToIntl(locale);
  const t = useTranslations();
  const statusLabel = t(STATUS_LABELS[instance.status].ru, STATUS_LABELS[instance.status].en);

  const issues: string[] = [];
  if (instance.status !== "healthy") {
    issues.push(
      t(`${STATUS_LABELS[instance.status].ru}`, `${STATUS_LABELS[instance.status].en}`)
    );
  }
  if (instance.replicationLagMs > 0) {
    issues.push(t(`Репликационный lag: ${instance.replicationLagMs} мс`, `Replication lag: ${instance.replicationLagMs} ms`));
  }
  if (instance.storageUsagePercent >= 85) {
    issues.push(
      t(`Хранилище: ${instance.storageUsagePercent}%`, `Storage: ${instance.storageUsagePercent}%`)
    );
  }
  if (instance.error) {
    issues.push(t(`Ошибка проверки: ${instance.error}`, `Check error: ${instance.error}`));
  }

  const hasIssues = issues.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-border/60 p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {hasIssues ? (
            <>
              <Info className="h-4 w-4 text-amber-500" />
              {t("Ответ проверки кластера", "Cluster check result")}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("Все проверки успешны", "All checks passed")}
            </>
          )}
        </div>
        <h3 className="mt-1 text-xl font-semibold">{instance.name}</h3>
        <p className="text-xs text-muted-foreground">
          {instance.engine} {instance.version} · {instance.region} · {instance.role}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoRow label={t("", "")}>
            <StatusBadge tone={STATUS_TONES[instance.status]}>
              {statusLabel}
            </StatusBadge>
          </InfoRow>
          <InfoRow label={t("P95 задержка", "P95 latency")}>
            {instance.latencyMsP95} {t("мс", "ms")}
          </InfoRow>
          <InfoRow label="QPS">{instance.queriesPerSecond.toLocaleString(intlLocale)}</InfoRow>
          <InfoRow label={t("Подключений", "Connections")}>{instance.connections.toLocaleString(intlLocale)}</InfoRow>
          <InfoRow label={t("Репликационный lag", "Replication lag")}>
            {instance.replicationLagMs} {t("мс", "ms")}
          </InfoRow>
          <InfoRow label={t("Последний бэкап", "Last backup")}>{instance.lastBackup || "—"}</InfoRow>
          <InfoRow label={t("Хранилище", "Storage")}>
            {instance.storageUsedGb} / {instance.storageTotalGb} {t("ГБ", "GB")} · {instance.storageUsagePercent}%
          </InfoRow>
          <InfoRow label="Uptime">{statusLabel}</InfoRow>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold">{t("Детали", "Details")}</p>
          {hasIssues ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {issues.map((issue) => (
                <li key={issue}>• {issue}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>{t("Проблем не обнаружено — кластер в порядке", "No issues found — cluster is healthy")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-3 text-foreground">{children}</span>
    </div>
  );
}
