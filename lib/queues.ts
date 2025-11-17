import fs from "fs/promises";
import path from "path";

type QueueStatus = "up" | "down";

export type QueueEntry = {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  status: QueueStatus;
  latencyMs: number;
  message: string;
  updatedAt: string;
};

export type QueueMonitoringData = {
  generatedAt: string;
  summary: {
    total: number;
    up: number;
    down: number;
  };
  queues: QueueEntry[];
  error?: string | null;
};

async function loadLocalStream(): Promise<QueueMonitoringData | null> {
  const customPath = process.env.QUEUE_STREAM_PATH;
  const filePath = customPath
    ? path.isAbsolute(customPath)
      ? customPath
      : path.resolve(process.cwd(), customPath)
    : path.resolve(process.cwd(), "../output/queue_stream.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as QueueMonitoringData;
  } catch {
    return null;
  }
}

export async function loadQueueMonitoringData(): Promise<QueueMonitoringData> {
  const streamed = await loadLocalStream().catch(() => null);
  if (streamed && !streamed.error) {
    return streamed;
  }
  return {
    generatedAt: new Date().toISOString(),
    summary: { total: 0, up: 0, down: 0 },
    queues: [],
    error: streamed?.error ?? null
  };
}
