"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageCheck, PackageOpen, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PackageUpdates, PackageSourceUpdates } from "@/lib/report";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge, type StatusTone } from "./status-badge";

type VersionsPanelProps = {
  updates: PackageUpdates;
};

type SourceKey = "python" | "node";

export function VersionsPanel({ updates }: VersionsPanelProps) {
  const sources = useMemo(() => {
    const list: PackageSourceUpdates[] = [updates.python];
    if (updates.node && updates.node.enabled) {
      list.push(updates.node);
    }
    return list;
  }, [updates]);

  const [activeKey, setActiveKey] = useState<SourceKey>("python");

  useEffect(() => {
    if (!sources.some((source) => source.key === activeKey)) {
      setActiveKey((sources[0]?.key ?? "python") as SourceKey);
    }
  }, [sources, activeKey]);

  const activeSource = sources.find((source) => source.key === activeKey) ?? sources[0];

  return (
    <Card className="flex h-full max-h-[540px] flex-col">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <CardTitle>Пакеты</CardTitle>
          <CardDescription>Обновления зависимостей из отчета</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sources.map((source) => (
            <button
              key={source.key}
              type="button"
              onClick={() => setActiveKey(source.key)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition",
                activeSource?.key === source.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {source.key === "python" ? <PackageOpen className="h-3.5 w-3.5" /> : <PackageCheck className="h-3.5 w-3.5" />}
              {source.label}
              <span className="text-[10px] font-semibold text-muted-foreground">
                {source.updatesAvailable}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[320px] pr-3 md:h-[360px] lg:h-[400px]">
          <div className="space-y-4 pb-2">
            {activeSource ? (
              <>
                <div className="flex items-center justify-between rounded-xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
                  <div>
                    Всего: <span className="font-semibold text-foreground">{activeSource.total}</span>
                  </div>
                  <div>
                    Обновлений: <span className="font-semibold text-foreground">{activeSource.updatesAvailable}</span> · Major:{" "}
                    <span className="font-semibold text-foreground">{activeSource.majorUpdates}</span>
                  </div>
                </div>
                {activeSource.packages.length ? (
                  activeSource.packages.map((pkg) => (
                    <div key={`${activeSource.key}-${pkg.name}`} className="rounded-xl border bg-card/60 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{pkg.name}</p>
                        <StatusBadge tone={getPackageTone(pkg.status)}>{pkg.status}</StatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {pkg.current_version} → {pkg.latest_version}
                      </p>
                      {pkg.projects?.length ? (
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          {pkg.projects[0]}
                          {pkg.projects.length > 1 ? ` и еще ${pkg.projects.length - 1}` : ""}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Нет обновлений для {activeSource.label}.</p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" /> Нет данных о пакетах.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function getPackageTone(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (normalized.includes("major") || normalized.includes("critical") || normalized.includes("patch") || normalized.includes("update")) {
    return "danger";
  }
  if (normalized.includes("warning") || normalized.includes("minor")) {
    return "warning";
  }
  if (normalized.includes("ok") || normalized.includes("up-to-date")) {
    return "success";
  }
  return "info";
}
