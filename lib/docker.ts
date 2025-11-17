import fs from "fs/promises";
import path from "path";

type ContainerStatus = "running" | "starting" | "failed" | "stopped";
type ContainerHealth = "passing" | "warning" | "failing";
type NodeStatus = "online" | "drain" | "offline";
type NodeRole = "manager" | "worker";
type EventType = "info" | "warning" | "error";

export type DockerContainer = {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  health: ContainerHealth;
  node: string;
  uptime: string;
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  restarts: number;
  ports: string;
  updatedAt: string;
};

export type DockerNode = {
  id: string;
  name: string;
  role: NodeRole;
  status: NodeStatus;
  dockerVersion: string;
  cpuUsage: number;
  memoryUsageGb: number;
  memoryCapacityGb: number;
  runningContainers: number;
};

export type DockerEvent = {
  id: string;
  scope: string;
  type: EventType;
  message: string;
  timestamp: string;
};

export type DockerMonitoringData = {
  generatedAt: string;
  summary: {
    runningContainers: number;
    unhealthyContainers: number;
    warningCount: number;
    avgCpuUsage: number;
  };
  containers: DockerContainer[];
  nodes: DockerNode[];
  events: DockerEvent[];
  error?: string | null;
};

async function loadStream(): Promise<DockerMonitoringData | null> {
  const local = await loadLocalStream();
  if (local) return local;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/docker`, {
    cache: "no-store"
  });
  if (!res.ok) return null;
  return (await res.json()) as DockerMonitoringData;
}

async function loadLocalStream(): Promise<DockerMonitoringData | null> {
  const customPath = process.env.DOCKER_STREAM_PATH;
  const filePath = customPath
    ? path.isAbsolute(customPath)
      ? customPath
      : path.resolve(process.cwd(), customPath)
    : path.resolve(process.cwd(), "../output/docker_stream.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as DockerMonitoringData;
  } catch {
    return null;
  }
}

export async function loadDockerMonitoringData(): Promise<DockerMonitoringData> {
  const streamed = await loadStream().catch(() => null);
  if (streamed) {
    return streamed;
  }

  const now = new Date().toISOString();
  return {
    generatedAt: now,
    summary: {
      runningContainers: 0,
      unhealthyContainers: 0,
      warningCount: 0,
      avgCpuUsage: 0
    },
    containers: [],
    nodes: [],
    events: [],
    error: "Поток docker_stream.json недоступен"
  };
}
