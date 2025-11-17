import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const STREAM_PATH = path.resolve(process.cwd(), "../output/docker_stream.json");

export async function GET() {
  try {
    const raw = await fs.readFile(STREAM_PATH, "utf-8");
    const data = JSON.parse(raw);
    console.info("[api/docker] stream response", {
      generatedAt: data?.generatedAt,
      containers: data?.containers?.length ?? 0,
      nodes: data?.nodes?.length ?? 0,
      events: data?.events?.length ?? 0
    });
    return NextResponse.json(
      { ...data, error: data?.error ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const isMissing = (error as NodeJS.ErrnoException)?.code === "ENOENT";
    console.warn("[api/docker] stream read failed", {
      reason: isMissing ? "missing file" : "read/parse error",
      error
    });
    return NextResponse.json(
      {
        error: isMissing ? "Файл docker_stream.json ещё не создан" : "Не удалось прочитать поток docker",
        generatedAt: new Date().toISOString(),
        summary: {
          runningContainers: 0,
          unhealthyContainers: 0,
          warningCount: 0,
          avgCpuUsage: 0
        },
        containers: [],
        nodes: [],
        events: []
      },
      { status: 200 }
    );
  }
}
