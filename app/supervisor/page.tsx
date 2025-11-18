import { AlertTriangle, Clock, FileText, Terminal } from "lucide-react";

import { AnimatedSection } from "@/components/dashboard/animated-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loadSupervisorData } from "@/lib/supervisor";
import { cn } from "@/lib/utils";

export default async function SupervisorPage() {
  const data = await loadSupervisorData();

  return (
    <DashboardShell>
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-background">
        <AnimatedSection className="container space-y-8 py-10">
          <header className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Инфраструктура</p>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Supervisor</h1>
                <p className="text-muted-foreground">
                  Последние прогоны внешних процессов, stdout/stderr и exit-коды
                </p>
              </div>
              <StatusBadge tone={data.summary.failed ? "danger" : "success"} className="w-fit">
                {data.summary.total} процессов · {data.summary.failed} с ошибками
              </StatusBadge>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<Terminal className="h-4 w-4 text-primary" />}
              label="Всего процессов"
              value={data.summary.total}
              helper={`${data.summary.healthy} успешных последних запусков`}
            />
            <SummaryCard
              icon={<AlertTriangle className="h-4 w-4 text-primary" />}
              label="С ошибками"
              value={data.summary.failed}
              helper="exit_code != 0 или runtime error"
              variant={data.summary.failed ? "danger" : "muted"}
            />
            <SummaryCard
              icon={<Clock className="h-4 w-4 text-primary" />}
              label="Последние прогоны"
              value={data.processes[0]?.startedAt ? new Date(data.processes[0].startedAt).toLocaleString("ru-RU") : "—"}
              helper="По времени старта"
            />
          </section>

          <div className="grid gap-4">
            {data.processes.map((proc) => {
              const isRunning = proc.exitCode === null && !proc.error;
              const hasError = Boolean(proc.error) || (proc.exitCode !== null && proc.exitCode !== 0);
              const stdoutPreview = proc.stdout.slice(-5);
              const stderrPreview = proc.stderr.slice(-5);

              return (
                <Card key={`${proc.name}-${proc.sourcePath}`} className="overflow-hidden">
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-primary" />
                          {proc.name}
                        </CardTitle>
                        <StatusBadge tone={hasError ? "danger" : isRunning ? "info" : "success"}>
                          {hasError ? "Ошибка" : isRunning ? "Работает" : "OK"}
                        </StatusBadge>
                      </div>
                      <CardDescription className="flex flex-wrap items-center gap-3 text-xs">
                        <span>Команда: {proc.command || "—"}</span>
                        {proc.workingDir ? <Badge variant="outline">cwd: {proc.workingDir}</Badge> : null}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {proc.startedAt
                          ? new Date(proc.startedAt).toLocaleString("ru-RU")
                          : "Время неизвестно"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <Badge variant="outline" className={cn(hasError ? "border-destructive text-destructive" : "")}>
                        exit_code: {proc.exitCode ?? "—"}
                      </Badge>
                      <Badge variant="outline">
                        длительность: {proc.durationSeconds != null ? `${proc.durationSeconds}s` : "—"}
                      </Badge>
                      {proc.error ? (
                        <Badge variant="outline" className="border-destructive text-destructive">
                          {proc.error}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <LogBlock title="stdout" lines={stdoutPreview} emptyText="Нет вывода" />
                      <LogBlock
                        title="stderr"
                        lines={stderrPreview}
                        emptyText="Нет ошибок"
                        tone={stderrPreview.length ? "danger" : "muted"}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate" title={proc.sourcePath}>
                        Лог: {proc.sourcePath}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {!data.processes.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>Нет данных супервизора</CardTitle>
                  <CardDescription>
                    Проверьте конфиг `supervisor.enabled` и наличие файлов *_latest.json в output/supervisor.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
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
  variant = "default"
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper: string;
  variant?: "default" | "danger" | "muted";
}) {
  return (
    <Card
      className={cn(
        "transition duration-300 hover:border-primary/50 hover:shadow-lg",
        variant === "danger" ? "border-destructive/50 bg-destructive/5" : "",
        variant === "muted" ? "border-border/60 bg-muted/30" : ""
      )}
    >
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

function LogBlock({
  title,
  lines,
  emptyText,
  tone = "default"
}: {
  title: string;
  lines: string[];
  emptyText: string;
  tone?: "default" | "danger" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/50">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-2">
        <p className="text-sm font-medium">{title}</p>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            tone === "danger" ? "border-destructive text-destructive" : "",
            tone === "muted" ? "border-border text-muted-foreground" : ""
          )}
        >
          {lines.length ? `${lines.length} строк` : "нет данных"}
        </Badge>
      </div>
      <div className="max-h-52 space-y-1 overflow-y-auto px-4 py-3 text-xs font-mono text-muted-foreground">
        {lines.length ? (
          lines.map((line, idx) => (
            <p key={idx} className="whitespace-pre-wrap leading-snug">
              {line}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">{emptyText}</p>
        )}
      </div>
      <Separator className="opacity-50" />
    </div>
  );
}
