import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const STREAM_PATH = path.resolve(process.cwd(), "../output/queue_stream.json");

export async function GET() {
  try {
    const raw = await fs.readFile(STREAM_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(
      { ...data, error: data?.error ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const isMissing = (error as NodeJS.ErrnoException)?.code === "ENOENT";
    return NextResponse.json(
      {
        error: isMissing ? "Файл queue_stream.json ещё не создан" : "Не удалось прочитать поток очередей",
        generatedAt: new Date().toISOString(),
        summary: { total: 0, up: 0, down: 0 },
        queues: []
      },
      { status: 200 }
    );
  }
}
