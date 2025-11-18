import fs from "fs/promises";
import path from "path";

export type SupervisorStatus = "ok" | "error";

export type SupervisorSnapshot = {
  name: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  exitCode: number | null;
  error: string | null;
  command: string;
  workingDir: string | null;
  stdout: string[];
  stderr: string[];
  sourcePath: string;
};

export type SupervisorSummary = {
  total: number;
  healthy: number;
  failed: number;
};

export type SupervisorData = {
  summary: SupervisorSummary;
  processes: SupervisorSnapshot[];
};

const DEFAULT_DIR = path.resolve(process.cwd(), "../output/supervisor");

export async function loadSupervisorData(): Promise<SupervisorData> {
  const baseDir = resolveBaseDir();
  const processes: SupervisorSnapshot[] = [];

  const candidates = await collectLatestFiles(baseDir);

  for (const filePath of candidates) {
    const snapshot = await readSnapshot(filePath);
    if (snapshot) {
      processes.push(snapshot);
    }
  }

  const summary: SupervisorSummary = {
    total: processes.length,
    healthy: processes.filter((p) => (p.exitCode === 0 || p.exitCode === null) && !p.error).length,
    failed: processes.filter((p) => (p.exitCode !== null && p.exitCode !== 0) || Boolean(p.error)).length
  };

  return { summary, processes: processes.sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? "")) };
}

function resolveBaseDir(): string {
  const custom = process.env.SUPERVISOR_DIR;
  if (custom) {
    return path.isAbsolute(custom) ? custom : path.resolve(process.cwd(), custom);
  }
  return DEFAULT_DIR;
}

async function collectLatestFiles(baseDir: string): Promise<string[]> {
  const files: string[] = [];

  const addLatestJson = async (dir: string) => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith("_latest.json")) {
          files.push(path.join(dir, entry.name));
        }
      }
    } catch {
      // ignore directory read errors
    }
  };

  await addLatestJson(baseDir);

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await addLatestJson(path.join(baseDir, entry.name));
      }
    }
  } catch {
    // ignore missing base dir
  }

  return files;
}

async function readSnapshot(filePath: string): Promise<SupervisorSnapshot | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    return normalizeSnapshot(data, filePath);
  } catch {
    return null;
  }
}

function normalizeSnapshot(data: Record<string, unknown>, sourcePath: string): SupervisorSnapshot {
  const stdout = Array.isArray(data.stdout) ? data.stdout.filter(isString) : [];
  const stderr = Array.isArray(data.stderr) ? data.stderr.filter(isString) : [];
  const commandArray =
    Array.isArray(data.command) && data.command.every(isString)
      ? (data.command as string[])
      : [];

  return {
    name: stringOrNull(data.name) ?? "supervised-task",
    startedAt: stringOrNull(data.started_at),
    endedAt: stringOrNull(data.ended_at),
    durationSeconds: numberOrNull(data.duration_seconds),
    exitCode: numberOrNull(data.exit_code),
    error: stringOrNull(data.error),
    workingDir: stringOrNull(data.working_dir),
    command: commandArray.length ? commandArray.join(" ") : stringOrNull(data.command as string) ?? "",
    stdout,
    stderr,
    sourcePath
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
