"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

import { useLanguage, useTranslations } from "@/components/language-provider";
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DockerContainer, DockerEvent } from "@/lib/docker";
import { localeToIntl } from "@/lib/i18n";

const CONTAINER_STATUS_TONE: Record<DockerContainer["status"], StatusTone> = {
  running: "success",
  starting: "info",
  failed: "danger",
  stopped: "warning"
};

const HEALTH_TONE: Record<DockerContainer["health"], StatusTone> = {
  passing: "success",
  warning: "warning",
  failing: "danger"
};

type Props = {
  containers: DockerContainer[];
  events: DockerEvent[];
};

export function ContainerTable({ containers, events }: Props) {
  const { locale } = useLanguage();
  const t = useTranslations();
  const intlLocale = localeToIntl(locale);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => containers.find((item) => item.id === selectedId) ?? null, [containers, selectedId]);
  const selectedIssues = useMemo(
    () => (selected ? getContainerIssues(selected, events, t) : []),
    [selected, events, t]
  );

  return (
    <>
      <Table className="px-4">
        <TableHeader>
          <TableRow>
            <TableHead>{t("Сервис", "Service")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("", "")}</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>CPU</TableHead>
            <TableHead className="hidden xl:table-cell">{t("Память", "Memory")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("Перезапуски", "Restarts")}</TableHead>
            <TableHead>{t("Порты", "Ports")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.map((container) => {
            const openModal = () => setSelectedId(container.id);

            return (
              <TableRow
                key={container.id}
                role="button"
                tabIndex={0}
                onClick={openModal}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openModal();
                  }
                }}
                className="cursor-pointer transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{container.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {container.image} · {container.node}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <StatusBadge tone={CONTAINER_STATUS_TONE[container.status]}>
                    {container.status}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={HEALTH_TONE[container.health]}>
                    {container.health}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={container.cpuPercent} />
                    <p className="text-xs text-muted-foreground">{container.cpuPercent}%</p>
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="space-y-1">
                    <Progress value={getMemoryPercent(container)} />
                    <p className="text-xs text-muted-foreground">
                      {container.memoryUsageMb} / {container.memoryLimitMb} {t("МБ", "MB")}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{container.restarts}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{container.ports}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ContainerModal
        container={selected}
        events={events}
        issues={selectedIssues}
        intlLocale={intlLocale}
        t={t}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

function getMemoryPercent(container: DockerContainer) {
  if (!container.memoryLimitMb) return 0;
  return Math.round((container.memoryUsageMb / container.memoryLimitMb) * 100);
}

function getContainerIssues(
  container: DockerContainer,
  events: DockerEvent[],
  t: ReturnType<typeof useTranslations>
): string[] {
  const issues: string[] = [];
  if (container.status !== "running") {
    issues.push(`${t("", "")}: ${container.status}`);
  }
  if (container.health !== "passing") {
    issues.push(`Health: ${container.health}`);
  }
  events
    .filter((event) => event.scope === container.name || event.scope === container.id)
    .forEach((event) => issues.push(`${event.type}: ${event.message}`));

  return issues;
}

function ContainerModal({
  container,
  issues,
  events,
  intlLocale,
  t,
  onClose
}: {
  container: DockerContainer | null;
  issues: string[];
  events: DockerEvent[];
  intlLocale: "ru-RU" | "en-US";
  t: ReturnType<typeof useTranslations>;
  onClose: () => void;
}) {
  if (!container) return null;

  const scopedEvents = events.filter(
    (event) => event.scope === container.name || event.scope === container.id
  );
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
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t("Проблемы контейнера", "Container issues")}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t("Все проверки успешны", "All checks passed")}
            </>
          )}
        </div>
        <h3 className="mt-1 text-xl font-semibold">{container.name}</h3>
        <p className="text-xs text-muted-foreground">{container.image} · {container.node}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoRow label={t("", "")}>
            <StatusBadge tone={CONTAINER_STATUS_TONE[container.status]}>{container.status}</StatusBadge>
          </InfoRow>
          <InfoRow label="Health">
            <StatusBadge tone={HEALTH_TONE[container.health]}>{container.health}</StatusBadge>
          </InfoRow>
          <InfoRow label={t("Перезапуски", "Restarts")}>{container.restarts}</InfoRow>
          <InfoRow label={t("Порты", "Ports")}>{container.ports || "—"}</InfoRow>
          <InfoRow label="CPU">{container.cpuPercent}%</InfoRow>
          <InfoRow label={t("Память", "Memory")}>
            {container.memoryUsageMb} / {container.memoryLimitMb || "—"} {t("МБ", "MB")}
          </InfoRow>
          <InfoRow label="Uptime">{container.uptime}</InfoRow>
          <InfoRow label={t("Обновлено", "Updated")}>{new Date(container.updatedAt).toLocaleString(intlLocale)}</InfoRow>
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
              <span>{t("Проблем не обнаружено — контейнер в порядке", "No issues found — container is healthy")}</span>
            </div>
          )}
        </div>

        {scopedEvents.length ? (
          <div className="mt-4">
            <p className="text-sm font-semibold">{t("События", "Events")}</p>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              {scopedEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-border/60 p-3">
                  <p className="font-medium">{event.type}</p>
                  <p>{event.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString(intlLocale)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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
