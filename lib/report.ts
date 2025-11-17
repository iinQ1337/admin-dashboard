import fs from "fs/promises";
import path from "path";
import YAML from "yaml";

const DEFAULT_REPORT_PATH = path.resolve(process.cwd(), "../output/report_2025-11-09_23-36-42.json");
const OUTPUT_DIR = path.resolve(process.cwd(), "../output");
const CONFIG_PATH = path.resolve(process.cwd(), "../config.yaml");

const MAIN_REPORT_REGEX = /^report_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/;
const SITE_FILE_REGEX =
  /^report_site-(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.json$/i;

async function resolveReportPath() {
  const customPath = process.env.REPORT_JSON_PATH;
  if (customPath) {
    return path.isAbsolute(customPath) ? customPath : path.resolve(process.cwd(), customPath);
  }

  try {
    await fs.access(DEFAULT_REPORT_PATH);
    return DEFAULT_REPORT_PATH;
  } catch {
    // ignore and search for the latest generated report instead
  }

  try {
    const files = await fs.readdir(OUTPUT_DIR);
    const latest = files
      .filter((file) => MAIN_REPORT_REGEX.test(file))
      .sort()
      .reverse()[0];
    if (latest) {
      return path.join(OUTPUT_DIR, latest);
    }
  } catch {
    // ignore and fall through to error below
  }

  const fallback = await findLatestSiteReport();
  if (fallback) {
    return fallback;
  }

  throw new Error(
    "Не найден ни один файл отчета. Укажите REPORT_JSON_PATH или сгенерируйте отчет в папке output."
  );
}

async function findLatestSiteReport() {
  try {
    const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
    const candidates: { timestamp: string; filePath: string }[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirPath = path.join(OUTPUT_DIR, entry.name);
      let files: string[];
      try {
        files = await fs.readdir(dirPath);
      } catch {
        continue;
      }
      for (const file of files) {
        const timestamp = extractSiteTimestamp(file);
        if (!timestamp) continue;
        candidates.push({
          timestamp,
          filePath: path.join(dirPath, file)
        });
      }
    }

    candidates.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (candidates.length) {
      return candidates[0].filePath;
    }
  } catch {
    // ignore
  }
  return null;
}

async function resolveSiteHistoryLimit() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = YAML.parse(raw) ?? {};
    const value = Number(config?.dashboard?.site_history?.files_per_site);
    if (Number.isFinite(value) && value > 0) {
      return Math.min(value, 50);
    }
  } catch {
    // ignore and fallback
  }
  return 5;
}

async function loadSiteHistory(limit: number): Promise<SiteHistory> {
  const history: SiteHistory = {};

  try {
    const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const siteKey = entry.name;
      const dirPath = path.join(OUTPUT_DIR, siteKey);
      let files: string[];
      try {
        files = await fs.readdir(dirPath);
      } catch {
        continue;
      }
      const ordered = files
        .map((file) => {
          const timestamp = extractSiteTimestamp(file);
          return timestamp ? { timestamp, path: path.join(dirPath, file) } : null;
        })
        .filter((value): value is { timestamp: string; path: string } => Boolean(value))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit);

      if (!ordered.length) continue;

      const reports: ScopedSiteReport[] = [];
      for (const file of ordered) {
        try {
          const content = await fs.readFile(file.path, "utf-8");
          reports.push(JSON.parse(content) as ScopedSiteReport);
        } catch {
          // skip if file unreadable
        }
      }
      if (reports.length) {
        const explicitSite = reports[0]?.site;
        history[explicitSite && explicitSite.length ? explicitSite : siteKey] = reports;
      }
    }
  } catch {
    // swallow, history stays empty
  }

  return history;
}

export type ApiResult = {
  url: string;
  method: string;
  status: number;
  response_time: number;
  success: boolean;
  error: string | null;
  response_preview?: string | null;
};

export type PageResult = ApiResult & {
  title: string | null;
  content_preview?: string | null;
  final_url?: string | null;
  redirects?: number;
  warnings?: string[];
};

export type ApiChecks = {
  total: number;
  successful: number;
  failed: number;
  avg_response_time: number;
  results: ApiResult[];
};

export type PageChecks = ApiChecks & {
  results: PageResult[];
};

export type ServerCheck = {
  timestamp: string;
  hostname: string;
  platform: string;
  overall_status: "ok" | "warning" | "critical" | string;
  cpu: {
    percent: number;
    load_avg: number[];
    threshold: number;
    status: string;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percent: number;
    threshold: number;
    status: string;
  };
  disk: Record<
    string,
    {
      total: number;
      used: number;
      free: number;
      percent: number;
      threshold: number;
      status: string;
    }
  >;
  uptime: {
    human: string;
    seconds: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  error: string | null;
};

export type VersionPackage = {
  name: string;
  current_version: string;
  latest_version: string;
  needs_update: boolean;
  status: "up_to_date" | "update_available" | string;
  source?: string;
  projects?: string[];
};

export type VersionsCheck = {
  total_packages: number;
  up_to_date: number;
  updates_available: number;
  major_updates_available: number;
  check_failed: number;
  packages: VersionPackage[];
  node?: {
    enabled: boolean;
    total_packages: number;
    up_to_date: number;
    updates_available: number;
    major_updates_available: number;
    check_failed: number;
    packages: VersionPackage[];
  };
};

export type LogFile = {
  path: string;
  exists: boolean;
  error: string | null;
  warnings: number;
  errors: number;
  critical: number;
  total_lines: number | null;
  analyzed_lines: number | null;
  last_errors: string[];
};

export type LogsCheck = {
  total_files: number;
  processed_files: number;
  failed_files: number;
  files: LogFile[];
};

export type DnsResult = {
  domain: string;
  status: string;
  error: string | null;
  dns: Record<string, string[]>;
  whois?: {
    registrar?: string;
    creation_date?: string;
    expiration_date?: string;
    name_servers?: string[];
  };
};

export type DnsCheck = {
  total_domains: number;
  errors: number;
  results: DnsResult[];
};

export type PortResult = {
  host: string;
  port: number;
  open: boolean;
  latency_ms: number;
  error?: string | null;
};

export type PortsCheck = {
  total_targets: number;
  open: number;
  closed_or_timeout: number;
  results: PortResult[];
};

export type TcpResult = {
  host: string;
  port: number;
  use_tls: boolean;
  success: boolean;
  response_preview?: string;
  latency_ms: number;
};

export type TcpCheck = {
  total_checks: number;
  successful: number;
  failed: number;
  results: TcpResult[];
};

export type SmtpResult = {
  host: string;
  port: number;
  tls: boolean;
  starttls: boolean;
  connected: boolean;
  ehlo_ok: boolean;
  starttls_ok: boolean;
  auth_ok: boolean;
  noop_ok: boolean;
  features: string[];
  banner: string | null;
  error: string | null;
  latency_ms: number;
  success: boolean;
};

export type SmtpCheck = {
  total_servers: number;
  successful: number;
  failed: number;
  results: SmtpResult[];
};

export type CertificateResult = {
  host: string;
  port: number;
  error: string | null;
  subject: string | null;
  issuer: string | null;
  not_before: string | null;
  not_after: string | null;
  days_remaining: number | null;
  expired: boolean | null;
  san: string[];
  latency_ms: number;
};

export type CertificatesCheck = {
  total_hosts: number;
  ok: number;
  warn: number;
  expired: number;
  results: CertificateResult[];
};

export type NetworkCheck = {
  enabled: boolean;
  overall_status: string;
  ports: PortsCheck;
  tcp: TcpCheck;
  smtp: SmtpCheck;
  certificates: CertificatesCheck;
};

export type SensitivePathResult = {
  base_url: string;
  path: string;
  url: string;
  status: number | null;
  exposed: boolean;
  error: string | null;
};

export type SensitivePathsCheck = {
  enabled: boolean;
  total_checked: number;
  exposed: number;
  errors: number;
  results: SensitivePathResult[];
};

export type ServiceReport = {
  site?: string;
  timestamp: string;
  checks: {
    api: ApiChecks;
    pages: PageChecks;
    server: ServerCheck;
    versions: VersionsCheck;
    logs: LogsCheck;
    dns: DnsCheck;
    network?: NetworkCheck;
    sensitive_paths?: SensitivePathsCheck;
  };
};

export type ScopedSiteReport = {
  site?: string;
  timestamp: string;
  checks: Partial<ServiceReport["checks"]>;
};

export type SiteHistory = Record<string, ScopedSiteReport[]>;

export type LoadedReports = {
  latest: ServiceReport;
  siteHistory: SiteHistory;
  filesPerSite: number;
};

export type DashboardSummary = {
  generatedAt: Date;
  totalChecks: number;
  successRate: number;
  avgLatency: number;
  incidents: number;
};

export type ChartPoint = {
  label: string;
  latency: number;
  category: "API" | "Page";
  status: "ok" | "warning";
  site?: string;
  timestamp?: string;
};

export type SuccessPoint = {
  category: string;
  success: number;
  failed: number;
};

export type SiteSeries = {
  latency: ChartPoint[];
  success: SuccessPoint[];
};

export type SiteSeriesMap = Record<string, SiteSeries>;

export async function loadReport(): Promise<LoadedReports> {
  const filePath = await resolveReportPath();
  const filesPerSite = await resolveSiteHistoryLimit();
  let latest: ServiceReport;
  try {
    const content = await fs.readFile(filePath, "utf-8");
    latest = JSON.parse(content) as ServiceReport;
  } catch (error) {
    throw new Error(`Не удалось прочитать отчет по пути ${filePath}. Убедитесь, что скрипт Python сгенерировал JSON.`);
  }

  const siteHistory = await loadSiteHistory(filesPerSite);

  return {
    latest,
    siteHistory,
    filesPerSite
  };
}

export function buildSummary(report: ServiceReport): DashboardSummary {
  const total = report.checks.api.total + report.checks.pages.total;
  const success = report.checks.api.successful + report.checks.pages.successful;
  const avgLatency =
    (report.checks.api.avg_response_time + report.checks.pages.avg_response_time) / 2;
  const incidents =
    report.checks.api.results.filter((r) => !r.success).length +
    report.checks.pages.results.filter((r) => !r.success).length;

  return {
    generatedAt: new Date(report.timestamp),
    totalChecks: total,
    successRate: total ? Math.round((success / total) * 1000) / 10 : 0,
    avgLatency,
    incidents
  };
}

export function buildLatencySeries(report: ServiceReport): ChartPoint[] {
  const apiPoints = report.checks.api.results.map((item) => ({
    label: safeHost(item.url),
    latency: typeof item.response_time === "number" ? item.response_time : 0,
    category: "API" as const,
    status: item.success ? ("ok" as const) : ("warning" as const),
    site: safeHost(item.url),
    timestamp: report.timestamp
  }));

  const pagePoints = report.checks.pages.results.map((item) => ({
    label: safeHost(item.url),
    latency: typeof item.response_time === "number" ? item.response_time : 0,
    category: "Page" as const,
    status: item.success ? ("ok" as const) : ("warning" as const),
    site: safeHost(item.url),
    timestamp: report.timestamp
  }));

  return [...apiPoints, ...pagePoints];
}

export function buildSuccessSeries(report: ServiceReport): SuccessPoint[] {
  return [
    {
      category: "API",
      success: report.checks.api.successful,
      failed: report.checks.api.failed
    },
    {
      category: "Pages",
      success: report.checks.pages.successful,
      failed: report.checks.pages.failed
    },
    {
      category: "DNS",
      success: report.checks.dns.total_domains - report.checks.dns.errors,
      failed: report.checks.dns.errors
    }
  ];
}

export function buildSiteSeries(
  history: SiteHistory,
  fallback: SiteSeriesMap = {}
): SiteSeriesMap {
  const result: SiteSeriesMap = { ...fallback };

  for (const [site, reports] of Object.entries(history)) {
    if (!reports.length) continue;

    const latencyPoints: ChartPoint[] = [];
    const totals: Record<string, { success: number; failed: number }> = {};

    const ordered = [...reports].sort((a, b) => {
      const first = new Date(a.timestamp).getTime();
      const second = new Date(b.timestamp).getTime();
      return first - second;
    });

    for (const report of ordered) {
      const timestamp = report.timestamp;
      const labelBase = formatHistoryLabel(timestamp);

      const api = report.checks?.api;
      if (checkHasData(api)) {
        const safeApi = api!;
        latencyPoints.push({
          site,
          timestamp,
          label: `${labelBase} · API`,
          latency: computeAvgLatency(safeApi),
          category: "API",
          status: safeApi.failed ? "warning" : "ok"
        });
        const success = typeof safeApi.successful === "number" ? safeApi.successful : 0;
        const failed = typeof safeApi.failed === "number" ? safeApi.failed : 0;
        if (!totals.API) {
          totals.API = { success: 0, failed: 0 };
        }
        totals.API.success += success;
        totals.API.failed += failed;
      }

      const pages = report.checks?.pages;
      if (checkHasData(pages)) {
        const safePages = pages!;
        latencyPoints.push({
          site,
          timestamp,
          label: `${labelBase} · Pages`,
          latency: computeAvgLatency(safePages),
          category: "Page",
          status: safePages.failed ? "warning" : "ok"
        });
        const success = typeof safePages.successful === "number" ? safePages.successful : 0;
        const failed = typeof safePages.failed === "number" ? safePages.failed : 0;
        if (!totals.Pages) {
          totals.Pages = { success: 0, failed: 0 };
        }
        totals.Pages.success += success;
        totals.Pages.failed += failed;
      }
    }

    const successPoints: SuccessPoint[] = Object.entries(totals).map(([category, values]) => ({
      category,
      success: values.success,
      failed: values.failed
    }));

    result[site] = {
      latency: latencyPoints,
      success: successPoints
    };
  }

  return result;
}

export type PackageSourceUpdates = {
  key: "python" | "node";
  label: string;
  enabled: boolean;
  total: number;
  upToDate: number;
  updatesAvailable: number;
  majorUpdates: number;
  checkFailed: number;
  packages: VersionPackage[];
};

export type PackageUpdates = {
  python: PackageSourceUpdates;
  node?: PackageSourceUpdates;
};

function buildPackageList(packages: VersionPackage[] | undefined, limit: number): VersionPackage[] {
  if (!Array.isArray(packages)) return [];
  return packages.filter((pkg) => pkg.needs_update).slice(0, limit);
}

export function getPackageUpdates(report: ServiceReport, limit = 6): PackageUpdates {
  const versionCheck = report.checks.versions;
  const pythonPackages = buildPackageList(versionCheck.packages, limit);

  const python: PackageSourceUpdates = {
    key: "python",
    label: "Python",
    enabled: true,
    total: versionCheck.total_packages,
    upToDate: versionCheck.up_to_date,
    updatesAvailable: versionCheck.updates_available,
    majorUpdates: versionCheck.major_updates_available,
    checkFailed: versionCheck.check_failed,
    packages: pythonPackages
  };

  let node: PackageSourceUpdates | undefined;
  if (versionCheck.node) {
    const nodePackages = buildPackageList(versionCheck.node.packages, limit);
    node = {
      key: "node",
      label: "Node.js",
      enabled: Boolean(versionCheck.node.enabled),
      total: versionCheck.node.total_packages,
      upToDate: versionCheck.node.up_to_date,
      updatesAvailable: versionCheck.node.updates_available,
      majorUpdates: versionCheck.node.major_updates_available,
      checkFailed: versionCheck.node.check_failed,
      packages: nodePackages
    };
  }

  return { python, node };
}

export function getProblematicLogs(report: ServiceReport) {
  return report.checks.logs.files.filter((file) => !file.exists || !!file.error || file.errors > 0);
}

export function getDnsAlerts(report: ServiceReport) {
  return report.checks.dns.results.filter((result) => result.error || result.status !== "ok");
}

function safeHost(raw: string) {
  try {
    return new URL(raw).host || raw;
  } catch {
    return raw;
  }
}

function formatHistoryLabel(timestamp: string) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return timestamp;
  }
}

function computeAvgLatency(check: ApiChecks | PageChecks | undefined): number {
  if (!check) return 0;
  if (typeof check.avg_response_time === "number") {
    return check.avg_response_time;
  }
  const latencies = (check.results ?? [])
    .map((item) => item.response_time)
    .filter((value): value is number => typeof value === "number");
  if (!latencies.length) return 0;
  const sum = latencies.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / latencies.length) * 100) / 100;
}

function checkHasData(check: ApiChecks | PageChecks | undefined): boolean {
  if (!check) return false;
  if (typeof check.total === "number" && check.total > 0) return true;
  return (check.results?.length ?? 0) > 0;
}

function extractSiteTimestamp(filename: string): string | null {
  const match = filename.match(SITE_FILE_REGEX);
  return match ? match[1] : null;
}
