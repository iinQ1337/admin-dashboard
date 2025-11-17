"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Activity, CircleOff, Cpu, Gauge, Loader2, MemoryStick, X } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatBytes } from "@/lib/utils";

type MetricPoint = {
  ts: string;
  value: number;
};

type ProcessInfo = {
  pid: number;
  name: string;
  user?: string;
  cpu: number;
  memory: number;
  command?: string;
};

type Snapshot = {
  status?: string;
  timestamp?: string;
  cpu?: {
    percent: number;
    per_core?: number[];
    load_avg?: number[] | null;
    history?: MetricPoint[];
  };
  memory?: {
    percent: number;
    total: number;
    used: number;
    available: number;
    history?: MetricPoint[];
  };
  processes?: ProcessInfo[];
  error?: string;
  details?: string;
};

type TaskManagerModalProps = {
  open: boolean;
  focus: "cpu" | "memory";
  onClose: () => void;
};

const POLL_INTERVAL = 2500;

export function TaskManagerModal({ open, focus, onClose }: TaskManagerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cpu" | "memory" | "processes">(focus);
  const [refreshTick, setRefreshTick] = useState(0);
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const [killMessage, setKillMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setActiveTab(focus);
    }
  }, [focus, open]);

  useEffect(() => {
    if (!open) return;

    let aborted = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const fetchSnapshot = async () => {
      try {
        const response = await fetch("/api/task-manager", { cache: "no-store" });
        const payload = await response.json();
        if (aborted) return;
        if (response.ok && !payload.error) {
          setSnapshot(payload);
          setError(null);
        } else {
          const details = payload.details ? ` (${payload.details})` : "";
          setError((payload.error ?? "Сервис недоступен") + details);
        }
      } catch (err) {
        if (!aborted) {
          setError((err as Error).message);
        }
      } finally {
        if (!aborted) {
          timeoutId = setTimeout(fetchSnapshot, POLL_INTERVAL);
        }
      }
    };

    fetchSnapshot();
    return () => {
      aborted = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [open, refreshTick]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const formattedUpdatedAt = useMemo(() => {
    if (!snapshot?.timestamp) return "нет данных";
    try {
      return new Date(snapshot.timestamp).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return snapshot.timestamp;
    }
  }, [snapshot?.timestamp]);

  useEffect(() => {
    if (!killMessage) return;
    const timer = setTimeout(() => setKillMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [killMessage]);

  useEffect(() => {
    if (!open) {
      setKillMessage(null);
      setKillingPid(null);
    }
  }, [open]);

  const handleTerminate = async (pid: number) => {
    setKillMessage(null);
    setKillingPid(pid);
    try {
      const response = await fetch("/api/task-manager/kill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pid })
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setKillMessage({ type: "success", text: `Процесс ${pid} завершён сигналом ${payload.signal ?? "SIGTERM"}` });
        setRefreshTick((tick) => tick + 1);
      } else {
        setKillMessage({ type: "error", text: payload.error ?? "Не удалось завершить процесс" });
      }
    } catch (err) {
      setKillMessage({ type: "error", text: (err as Error).message });
    } finally {
      setKillingPid(null);
    }
  };

  if (!open || !mounted) {
    return null;
  }

  const cpuHistory = snapshot?.cpu?.history ?? [];
  const memoryHistory = snapshot?.memory?.history ?? [];
  const status = snapshot?.status ?? (error ? "offline" : "connecting");
  const statusLabel = status === "ok" ? "Онлайн" : status === "connecting" ? "Подключение..." : "Оффлайн";
  const badgeVariant = status === "ok" ? "secondary" : status === "connecting" ? "outline" : "destructive";
  const badgeTint =
    status === "ok"
      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
      : status === "offline"
        ? "bg-rose-500/10 text-rose-500"
        : "bg-muted/70 text-muted-foreground";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-background/95 shadow-2xl max-h-[90vh]"
      >
        <header className="flex flex-col gap-4 border-b border-border/70 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Activity className="h-3.5 w-3.5" /> Live Task Manager
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">Ресурсы сервера</h2>
            <p className="text-sm text-muted-foreground">Обновлено: {formattedUpdatedAt}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={badgeVariant} className={cn("px-4 py-1 text-xs", badgeTint)}>
              {statusLabel}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {error ? <div className="border-b border-destructive/30 bg-destructive/10 px-6 py-3 text-sm text-destructive"> {error} </div> : null}

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "cpu" | "memory" | "processes")}>
              <TabsList className="flex-wrap gap-2 bg-muted/60">
                <TabsTrigger value="cpu" className="gap-2">
                  <Cpu className="h-4 w-4" /> CPU
                </TabsTrigger>
                <TabsTrigger value="memory" className="gap-2">
                  <MemoryStick className="h-4 w-4" /> Память
                </TabsTrigger>
                <TabsTrigger value="processes" className="gap-2">
                  <Activity className="h-4 w-4" /> Процессы
                </TabsTrigger>
              </TabsList>
              <TabsContent value="cpu">
                {snapshot?.cpu ? (
                  <MetricPanel
                    title="Загрузка CPU"
                    percent={snapshot.cpu.percent}
                    history={cpuHistory}
                    perCore={snapshot.cpu.per_core}
                    loadAvg={snapshot.cpu.load_avg}
                    accent="from-amber-500/10 to-amber-500/5"
                  />
                ) : (
                  <EmptyState />
                )}
              </TabsContent>
              <TabsContent value="memory">
                {snapshot?.memory ? (
                  <MetricPanel
                    title="Использование памяти"
                    percent={snapshot.memory.percent}
                    history={memoryHistory}
                    memoryMeta={{
                      total: snapshot.memory.total,
                      used: snapshot.memory.used,
                      available: snapshot.memory.available
                    }}
                    accent="from-sky-500/10 to-sky-500/5"
                  />
                ) : (
                  <EmptyState />
                )}
              </TabsContent>
              <TabsContent value="processes">
                <ProcessesPanel
                  processes={snapshot?.processes ?? []}
                  message={killMessage}
                  onTerminate={handleTerminate}
                  killingPid={killingPid}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

type MetricPanelProps = {
  title: string;
  percent: number;
  history: MetricPoint[];
  perCore?: number[];
  loadAvg?: number[] | null;
  memoryMeta?: {
    total: number;
    used: number;
    available: number;
  };
  accent: string;
};

function MetricPanel({ title, percent, history, perCore, loadAvg, memoryMeta, accent }: MetricPanelProps) {
  const formattedHistory = useMemo(
    () =>
      history.map((point) => ({
        ...point,
        label: formatTime(point.ts)
      })),
    [history]
  );
  const normalizedLoadAvg = Array.isArray(loadAvg) ? loadAvg : [];

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-b p-5 shadow-sm">
      <div className={cn("rounded-2xl bg-gradient-to-br p-5 text-white shadow-inner", accent)}>
        <p className="text-sm text-white/80">{title}</p>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold">{percent.toFixed(1)}%</span>
          <span className="text-xs uppercase tracking-wide text-white/70">сейчас</span>
        </div>
      </div>
      <div className="mt-4 h-48">
        {formattedHistory.length ? <MetricChart data={formattedHistory} /> : <EmptyState />}
      </div>
      {perCore?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {perCore.map((value, index) => (
            <div key={index} className="rounded-xl border border-border/60 bg-card/60 p-3">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                Ядро {index + 1}
                <span>{value.toFixed(1)}%</span>
              </div>
              <Progress value={value} className="mt-2" />
            </div>
          ))}
        </div>
      ) : null}
      {normalizedLoadAvg.length ? (
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {["1м", "5м", "15м"].map((label, idx) => (
            <span key={label} className="rounded-full border border-dashed px-3 py-1">
              {label}: {typeof normalizedLoadAvg[idx] === "number" ? normalizedLoadAvg[idx]!.toFixed(2) : "—"}
            </span>
          ))}
        </div>
      ) : null}
      {memoryMeta ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MemoryTile label="Используется" value={formatBytes(memoryMeta.used)} icon={<Gauge className="h-4 w-4" />} />
          <MemoryTile label="Доступно" value={formatBytes(memoryMeta.available)} icon={<MemoryStick className="h-4 w-4" />} />
          <MemoryTile label="Всего" value={formatBytes(memoryMeta.total)} icon={<Cpu className="h-4 w-4" />} />
        </div>
      ) : null}
    </div>
  );
}

type MemoryTileProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

function MemoryTile({ label, value, icon }: MemoryTileProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3 text-sm">
      <p className="flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function MetricChart({ data }: { data: (MetricPoint & { label: string })[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="label" interval="preserveStartEnd" hide />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null;
            const entry = payload[0].payload as MetricPoint & { label: string };
            return (
              <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow">
                <p className="font-medium">{entry.label}</p>
                <p>{entry.value.toFixed(1)}%</p>
              </div>
            );
          }}
        />
        <Line type="monotone" dataKey="value" strokeWidth={2.4} stroke="hsl(var(--primary))" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
      Нет данных
    </div>
  );
}

function ProcessesPanel({
  processes,
  onTerminate,
  killingPid,
  message
}: {
  processes: ProcessInfo[];
  onTerminate: (pid: number) => void;
  killingPid: number | null;
  message: { type: "success" | "error"; text: string } | null;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="mb-3 flex items-center justify-between text-sm font-medium">
        Топ процессов
        <Badge variant="outline" className="text-xs">
          {processes.length} шт.
        </Badge>
      </div>
      {message ? (
        <div
          className={cn(
            "mb-3 rounded-lg border px-3 py-2 text-xs",
            message.type === "success"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {message.text}
        </div>
      ) : null}
      <ScrollArea className="h-[60vh] pr-3 lg:h-[65vh]">
        <div className="space-y-3 pb-2">
          {processes.length ? (
            processes.map((proc) => (
              <div key={proc.pid} className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-[200px] flex-1">
                    <p className="truncate font-semibold text-foreground" title={proc.name}>
                      {proc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">PID {proc.pid}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTerminate(proc.pid)}
                    disabled={killingPid === proc.pid}
                    className="gap-1 px-2 text-destructive hover:text-destructive disabled:opacity-50"
                  >
                    {killingPid === proc.pid ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CircleOff className="h-3.5 w-3.5" />}
                    Завершить
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <UsageStat label="CPU" percent={proc.cpu} />
                  <UsageStat label="Память" percent={proc.memory} />
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {proc.user ? <span>{proc.user}</span> : null}
                </div>
                {proc.command ? (
                  <p className="mt-2 text-xs text-muted-foreground/80" title={proc.command}>
                    {shortenCommand(proc.command)}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Нет данных о процессах</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function UsageStat({ label, percent }: { label: string; percent: number }) {
  const safeValue = clampPercent(percent);
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3 text-xs">
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono text-sm text-foreground">{formatPercentValue(percent)}%</span>
      </div>
      <Progress value={safeValue} className="mt-2" />
    </div>
  );
}

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString("ru-RU", {
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return value;
  }
}

function shortenCommand(value: string) {
  if (!value || value.length <= 80) {
    return value;
  }
  const start = value.slice(0, 35);
  const end = value.slice(-25);
  return `${start}…${end}`;
}

function formatPercentValue(value: number) {
  if (!Number.isFinite(value)) {
    return "0.0";
  }
  if (Math.abs(value) >= 100) {
    return value.toFixed(0);
  }
  return value.toFixed(1);
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}
