import fs from "fs/promises";
import path from "path";

type DatabaseStatus = "healthy" | "degraded" | "critical" | "maintenance";
type DatabaseRole = "primary" | "replica" | "analytics";
type AlertSeverity = "info" | "warning" | "critical";
type BackupStatus = "success" | "running" | "failed";

export type DatabaseInstance = {
  id: string;
  name: string;
  engine: string;
  version: string;
  role: DatabaseRole;
  region: string;
  status: DatabaseStatus;
  queriesPerSecond: number;
  connections: number;
  replicationLagMs: number;
  storageUsedGb: number;
  storageTotalGb: number;
  storageUsagePercent: number;
  latencyMsP95: number;
  lastBackup: string;
  error?: string | null;
};

export type DatabaseBackupJob = {
  id: string;
  target: string;
  schedule: string;
  status: BackupStatus;
  lastRun: string;
  durationMinutes: number;
  path?: string;
  error?: string | null;
};

export type DatabaseAlert = {
  id: string;
  cluster: string;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
};

export type DatabaseMonitoringData = {
  generatedAt: string;
  summary: {
    totalClusters: number;
    healthyClusters: number;
    degradedClusters: number;
    avgReplicationLagMs: number;
    storagePressurePercent: number;
    criticalAlerts: number;
  };
  instances: DatabaseInstance[];
  backups: DatabaseBackupJob[];
  alerts: DatabaseAlert[];
  error?: string | null;
};

async function loadStream(): Promise<DatabaseMonitoringData | null> {
  const local = await loadLocalStream();
  if (local) return local;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/databases`, {
    cache: "no-store"
  });
  if (!res.ok) return null;
  return (await res.json()) as DatabaseMonitoringData;
}

async function loadLocalStream(): Promise<DatabaseMonitoringData | null> {
  const customPath = process.env.DATABASE_STREAM_PATH;
  const filePath = customPath
    ? path.isAbsolute(customPath)
      ? customPath
      : path.resolve(process.cwd(), customPath)
    : path.resolve(process.cwd(), "../output/database_stream.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as DatabaseMonitoringData;
  } catch {
    return null;
  }
}

export async function loadDatabaseMonitoringData(): Promise<DatabaseMonitoringData> {
  const streamed = await loadStream().catch(() => null);
  if (streamed) {
    return streamed;
  }

  const now = new Date().toISOString();
  return {
    generatedAt: now,
    summary: {
      totalClusters: 0,
      healthyClusters: 0,
      degradedClusters: 0,
      avgReplicationLagMs: 0,
      storagePressurePercent: 0,
      criticalAlerts: 0
    },
    instances: [],
    backups: [],
    alerts: [],
    error: "Поток database_stream.json недоступен"
  };
}
