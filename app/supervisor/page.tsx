import Link from "next/link";
import { Activity, AlertTriangle, Clock, FileText, Gauge, RefreshCw, Server, Terminal } from "lucide-react";

import { AnimatedSection } from "@/components/dashboard/animated-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loadSupervisorData } from "@/lib/supervisor";
import { createTranslator, formatDateTime, localeToIntl } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

export default async function SupervisorPage() {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  const intlLocale = localeToIntl(locale);
  const data = await loadSupervisorData();

  return (
    <DashboardShell>
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-background">
        <AnimatedSection className="container space-y-8 py-10">
          <header className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">{t("Инфраструктура", "Infrastructure")}</p>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Supervisor</h1>
                <p className="text-muted-foreground">
                  {t("Последние прогоны внешних процессов, stdout/stderr и exit-коды", "Latest external runs, stdout/stderr, and exit codes")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={data.summary.failed ? "danger" : "success"} className="w-fit">
                  {data.summary.total} {t("процессов", "processes")} · {data.summary.failed} {t("с ошибками", "with errors")}
                </StatusBadge>
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings?tab=supervisor">{t("Настройки супервизора", "Supervisor settings")}</Link>
                </Button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              icon={<Server className="h-4 w-4 text-primary" />}
              label={t("Всего процессов", "Total processes")}
              value={data.summary.total}
              helper={`${data.summary.healthy} ${t("здоровых", "healthy")}`}
            />
            <SummaryCard
              icon={<Activity className="h-4 w-4 text-primary" />}
              label={t("Активны", "Running")}
              value={data.summary.running}
              helper={t("exit_code == null и без ошибок", "exit_code == null and no errors")}
              variant={data.summary.running ? "default" : "muted"}
            />
            <SummaryCard
              icon={<AlertTriangle className="h-4 w-4 text-primary" />}
              label={t("С ошибками", "Failed")}
              value={data.summary.failed}
              helper={t("exit_code != 0 / force stop", "exit_code != 0 / force stop")}
              variant={data.summary.failed ? "danger" : "muted"}
            />
            <SummaryCard
              icon={<RefreshCw className="h-4 w-4 text-primary" />}
              label={t("Всего рестартов", "Total restarts")}
              value={data.summary.restarts}
              helper={t("Сумма restart_count", "Sum of restart_count")}
              variant={data.summary.restarts ? "default" : "muted"}
            />
          </section>

          <div className="grid gap-4">
            {data.processes.map((proc) => {
              const isRunning = proc.exitCode === null && !proc.error;
              const hasError = Boolean(proc.error || proc.forcedStopReason) || (proc.exitCode !== null && proc.exitCode !== 0);
              const stdoutPreview = proc.stdout.slice(-5);
              const stderrPreview = proc.stderr.slice(-5);
              const statusTone = hasError ? "danger" : isRunning ? "info" : "success";
              const statusLabel = hasError ? t("Ошибка / стоп", "Error / stopped") : isRunning ? t("Работает", "Running") : "OK";
              const resource = proc.resourceUsage;
              const lastActivity = formatLastActivity(proc.lastActivityTs, intlLocale);

              return (
                <Card key={`${proc.name}-${proc.sourcePath}`} className="overflow-hidden">
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-primary" />
                          {proc.name}
                        </CardTitle>
                        <StatusBadge tone={statusTone}>
                          {statusLabel}
                        </StatusBadge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {t("Команда", "Command")}: {proc.command || "—"}
                        </span>
                        {proc.workingDir ? <Badge variant="outline">cwd: {proc.workingDir}</Badge> : null}
                        {proc.pid ? <Badge variant="outline">PID: {proc.pid}</Badge> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {proc.startedAt
                          ? formatDateTime(proc.startedAt, locale, { dateStyle: "short", timeStyle: "short" })
                          : t("Время неизвестно", "Time unknown")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <Badge variant="outline" className={cn(hasError ? "border-destructive text-destructive" : "")}>
                        exit_code: {proc.exitCode ?? "—"}
                      </Badge>
                      <Badge variant="outline">
                        {t("длительность", "duration")}: {proc.durationSeconds != null ? `${proc.durationSeconds}s` : "—"}
                      </Badge>
                      <Badge variant="outline" className="border-border/70 text-muted-foreground">
                        {t("рестартов", "restarts")}: {proc.restartCount ?? 0}
                      </Badge>
                      {proc.restartReason ? (
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          {proc.restartReason}
                        </Badge>
                      ) : null}
                      {proc.forcedStopReason ? (
                        <Badge variant="outline" className="border-destructive/70 text-destructive">
                          {proc.forcedStopReason}
                        </Badge>
                      ) : null}
                      {proc.error ? (
                        <Badge variant="outline" className="border-destructive text-destructive">
                          {proc.error}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <MetricCard
                        title={t("Ресурсы", "Resources")}
                        icon={<Gauge className="h-4 w-4 text-primary" />}
                        items={[
                          { label: "CPU", value: resource?.cpuPercent != null ? `${resource.cpuPercent}%` : "—" },
                          { label: "RAM", value: resource?.memoryMb != null ? `${resource.memoryMb} MB` : "—" },
                          { label: "Conn", value: resource?.connections != null ? `${resource.connections}` : "—" }
                        ]}
                      />
                      <MetricCard
                        title={t("Сеть", "Network")}
                        icon={<Activity className="h-4 w-4 text-primary" />}
                        items={[
                          {
                            label: t("Интернет", "Internet"),
                            value: (() => {
                              const internet = resource?.internetConnected;
                              if (internet === null || internet === undefined) return "—";
                              return internet ? "online" : "offline";
                            })()
                          },
                          { label: t("Последняя активность", "Last activity"), value: lastActivity }
                        ]}
                      />
                      <MetricCard
                        title={t("Логи", "Logs")}
                        icon={<FileText className="h-4 w-4 text-primary" />}
                        items={[
                          { label: "stdout", value: `${stdoutPreview.length} ${t("строк", "lines")}` },
                          { label: "stderr", value: `${stderrPreview.length} ${t("строк", "lines")}` }
                        ]}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <LogBlock title="stdout" lines={stdoutPreview} emptyText={t("Нет вывода", "No output")} translate={t} />
                      <LogBlock
                        title="stderr"
                        lines={stderrPreview}
                        emptyText={t("Нет ошибок", "No errors")}
                        tone={stderrPreview.length ? "danger" : "muted"}
                        translate={t}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate" title={proc.sourcePath}>
                        {t("Лог", "Log")}: {proc.sourcePath}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {!data.processes.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Нет данных супервизора", "No supervisor data")}</CardTitle>
                  <CardDescription>
                    {t(
                      "Проверьте конфиг `supervisor.enabled` и наличие файлов *_latest.json в output/supervisor.",
                      "Check `supervisor.enabled` and the *_latest.json files in output/supervisor."
                    )}
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
  tone = "default",
  translate
}: {
  title: string;
  lines: string[];
  emptyText: string;
  tone?: "default" | "danger" | "muted";
  translate: ReturnType<typeof createTranslator>;
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
          {lines.length ? `${lines.length} ${translate("строк", "lines")}` : translate("нет данных", "no data")}
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

function MetricCard({
  title,
  icon,
  items
}: {
  title: string;
  icon: React.ReactNode;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{item.label}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLastActivity(value: string | number | null, intlLocale: "ru-RU" | "en-US"): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return `t=${Math.round(value)}s`;
  }
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString(intlLocale);
  }
  return String(value);
}
