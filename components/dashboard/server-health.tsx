"use client";

import { useState } from "react";

import { Activity, Cpu, HardDrive, Network, ThermometerIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ServerCheck } from "@/lib/report";
import { formatBytes } from "@/lib/utils";
import { TaskManagerModal } from "./task-manager-modal";
import { StatusBadge, type StatusTone } from "./status-badge";

const STATUS_TONES: Record<string, StatusTone> = {
  ok: "success",
  warning: "warning",
  critical: "danger"
};

const STATUS_LABELS: Record<string, string> = {
  ok: "В норме",
  warning: "Предупреждение",
  critical: "Авария"
};

export function ServerHealth({ server }: { server: ServerCheck }) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskFocus, setTaskFocus] = useState<"cpu" | "memory">("cpu");

  const disks = Object.entries(server.disk);
  const health = [
    { label: "CPU", value: server.cpu.percent, icon: Cpu, type: "cpu" as const },
    { label: "Память", value: server.memory.percent, icon: ThermometerIcon, type: "memory" as const }
  ];

  const openTaskManager = (type: "cpu" | "memory") => {
    setTaskFocus(type);
    setTaskModalOpen(true);
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Сервер</CardTitle>
            <CardDescription>{server.hostname}</CardDescription>
          </div>
          <StatusBadge
            tone={STATUS_TONES[server.overall_status] ?? "info"}
            className="text-xs font-medium uppercase tracking-wide"
          >
            {STATUS_LABELS[server.overall_status] ?? server.overall_status}
          </StatusBadge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {health.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => openTaskManager(item.type)}
                aria-label={`Открыть диспетчер для ${item.label}`}
                className="rounded-xl border border-border/70 bg-card/40 p-4 text-left transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="mb-3 flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" /> {item.label}
                  </span>
                  <span>{item.value}%</span>
                </div>
                <Progress value={item.value} />
                <p className="mt-2 text-xs text-primary">Открыть диспетчер</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border bg-card/50 p-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Диски</p>
            <div className="space-y-3">
              {disks.map(([mount, disk]) => (
                <div key={mount} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      {mount}
                    </div>
                    <span>{disk.percent}%</span>
                  </div>
                  <Progress value={disk.percent} />
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(disk.used)} / {formatBytes(disk.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card/40 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" /> Аптайм
              </p>
              <p className="text-lg font-semibold">{server.uptime.human}</p>
            </div>
            <div className="rounded-xl border bg-card/40 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Network className="h-4 w-4" /> Трафик
              </p>
              <p className="text-lg font-semibold">
                ↑ {formatBytes(server.network.bytes_sent)} <br />↓ {formatBytes(server.network.bytes_recv)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <TaskManagerModal open={taskModalOpen} focus={taskFocus} onClose={() => setTaskModalOpen(false)} />
    </>
  );
}
