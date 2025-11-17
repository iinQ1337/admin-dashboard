import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const STREAM_PATH = path.resolve(process.cwd(), "../output/database_stream.json");

export async function GET() {
  try {
    const raw = await fs.readFile(STREAM_PATH, "utf-8");
    const data = JSON.parse(raw);
    console.info("[api/databases] stream response", {
      generatedAt: data?.generatedAt,
      instances: data?.instances?.length ?? 0,
      alerts: data?.alerts?.length ?? 0,
      backups: data?.backups?.length ?? 0
    });
    return NextResponse.json(
      { ...data, error: data?.error ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const isMissing = (error as NodeJS.ErrnoException)?.code === "ENOENT";
    console.warn("[api/databases] stream read failed", {
      reason: isMissing ? "missing file" : "read/parse error",
      error
    });
    return NextResponse.json(
      {
        error: isMissing ? "Файл database_stream.json ещё не создан" : "Не удалось прочитать поток БД",
        generatedAt: new Date().toISOString(),
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
        alerts: []
      },
      { status: 200 }
    );
  }
}
