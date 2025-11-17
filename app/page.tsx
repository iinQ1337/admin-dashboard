import { AnimatedSection } from "@/components/dashboard/animated-section";
import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { PerformancePanel } from "@/components/dashboard/performance-panel";
import { ChecksTable } from "@/components/dashboard/checks-table";
import { ServerHealth } from "@/components/dashboard/server-health";
import { LogsPanel } from "@/components/dashboard/logs-panel";
import { DnsPanel } from "@/components/dashboard/dns-panel";
import { VersionsPanel } from "@/components/dashboard/versions-panel";
import { NetworkPanel } from "@/components/dashboard/network-panel";
import { SensitivePathsPanel } from "@/components/dashboard/sensitive-paths-panel";
import {
  buildLatencySeries,
  buildSiteSeries,
  buildSuccessSeries,
  buildSummary,
  getProblematicLogs,
  getPackageUpdates,
  loadReport
} from "@/lib/report";

export default async function DashboardPage() {
  const { latest: report, siteHistory } = await loadReport();
  const summary = buildSummary(report);
  const latency = buildLatencySeries(report);
  const success = buildSuccessSeries(report);
  const updates = getPackageUpdates(report);
  const logs = getProblematicLogs(report);
  const network = report.checks.network;
  const sensitivePaths = report.checks.sensitive_paths;
  const updatedAt = summary.generatedAt.toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <DashboardShell>
      <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-background via-background to-background">
        <div className="background-lights">
          <div className="light" />
          <div className="light" />
          <div className="light" />
        </div>
        <div className="relative z-10 container space-y-8 py-10">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Сервис online</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Единая панель наблюдения</h1>
              <p className="text-sm text-muted-foreground">Данные из JSON · обновлено {updatedAt}</p>
            </div>
            <DashboardActions />
          </header>

          <AnimatedSection delay={0.05}>
            <OverviewCards summary={summary} />
          </AnimatedSection>

          <div className="grid gap-6 lg:grid-cols-3">
            <AnimatedSection id="dashboard-performance" className="lg:col-span-2" delay={0.1}>
              <PerformancePanel siteSeries={buildSiteSeries(siteHistory, { all: { latency, success } })} />
            </AnimatedSection>
            <AnimatedSection delay={0.12}>
              <ServerHealth server={report.checks.server} />
            </AnimatedSection>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <AnimatedSection id="dashboard-checks" className="lg:col-span-2" delay={0.18}>
              <ChecksTable api={report.checks.api} pages={report.checks.pages} />
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <VersionsPanel updates={updates} />
            </AnimatedSection>
          </div>

          {network ? (
            <AnimatedSection delay={0.22}>
              <NetworkPanel network={network} />
            </AnimatedSection>
          ) : null}

          {sensitivePaths ? (
            <AnimatedSection delay={0.24}>
              <SensitivePathsPanel data={sensitivePaths} />
            </AnimatedSection>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <AnimatedSection id="dashboard-logs" delay={0.26}>
              <LogsPanel files={logs} />
            </AnimatedSection>
            <AnimatedSection delay={0.28}>
              <DnsPanel results={report.checks.dns.results.slice(0, 4)} />
            </AnimatedSection>
          </div>
        </div>
      </main>
    </DashboardShell>
  );
}
