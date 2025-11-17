"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Info, X } from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DatabaseInstance } from "@/lib/databases";

const STATUS_TONES: Record<DatabaseInstance["status"], StatusTone> = {
  healthy: "success",
  degraded: "warning",
  critical: "danger",
  maintenance: "info"
};

const STATUS_LABELS: Record<DatabaseInstance["status"], string> = {
  healthy: "В норме",
  degraded: "Замедление",
  critical: "Авария",
  maintenance: "Обслуживание"
};

type Props = {
  instances: DatabaseInstance[];
};

export function InstancesTable({ instances }: Props) {
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
            <TableHead>Кластер</TableHead>
            <TableHead className="hidden lg:table-cell">Роль</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="hidden xl:table-cell">P95, мс</TableHead>
            <TableHead>QPS</TableHead>
            <TableHead className="hidden xl:table-cell">Lag, мс</TableHead>
            <TableHead>Хранилище</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instances.map((instance) => (
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
                  {STATUS_LABELS[instance.status]}
                </StatusBadge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">{instance.latencyMsP95} мс</TableCell>
              <TableCell>{instance.queriesPerSecond.toLocaleString("ru-RU")}</TableCell>
              <TableCell className="hidden xl:table-cell">
                {instance.replicationLagMs} мс
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Progress value={instance.storageUsagePercent} />
                  <p className="text-xs text-muted-foreground">
                    {instance.storageUsedGb} из {instance.storageTotalGb} ГБ
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ))}
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

  const issues: string[] = [];
  if (instance.status !== "healthy") {
    issues.push(`Статус: ${STATUS_LABELS[instance.status]}`);
  }
  if (instance.replicationLagMs > 0) {
    issues.push(`Репликационный lag: ${instance.replicationLagMs} мс`);
  }
  if (instance.storageUsagePercent >= 85) {
    issues.push(`Хранилище: ${instance.storageUsagePercent}%`);
  }
  if (instance.error) {
    issues.push(`Ошибка проверки: ${instance.error}`);
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
              Ответ проверки кластера
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Все проверки успешны
            </>
          )}
        </div>
        <h3 className="mt-1 text-xl font-semibold">{instance.name}</h3>
        <p className="text-xs text-muted-foreground">
          {instance.engine} {instance.version} · {instance.region} · {instance.role}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoRow label="Статус">
            <StatusBadge tone={STATUS_TONES[instance.status]}>
              {STATUS_LABELS[instance.status]}
            </StatusBadge>
          </InfoRow>
          <InfoRow label="P95 задержка">{instance.latencyMsP95} мс</InfoRow>
          <InfoRow label="QPS">{instance.queriesPerSecond.toLocaleString("ru-RU")}</InfoRow>
          <InfoRow label="Подключений">{instance.connections.toLocaleString("ru-RU")}</InfoRow>
          <InfoRow label="Репликационный lag">{instance.replicationLagMs} мс</InfoRow>
          <InfoRow label="Последний бэкап">{instance.lastBackup || "—"}</InfoRow>
          <InfoRow label="Хранилище">
            {instance.storageUsedGb} / {instance.storageTotalGb} ГБ · {instance.storageUsagePercent}%
          </InfoRow>
          <InfoRow label="Uptime ответа">{STATUS_LABELS[instance.status]}</InfoRow>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold">Детали</p>
          {hasIssues ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {issues.map((issue) => (
                <li key={issue}>• {issue}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>Проблем не обнаружено — кластер в порядке</span>
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
