import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
const STREAM_PATH = path.resolve(process.cwd(), "../output/task_manager_stream.json");

export async function GET() {
  try {
    const raw = await fs.readFile(STREAM_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(
      { ...data, status: data?.status ?? "ok" },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    const isMissing = (error as NodeJS.ErrnoException)?.code === "ENOENT";
    return NextResponse.json(
      {
        status: "offline",
        error: isMissing ? "Файл task_manager_stream.json ещё не создан" : "Не удалось прочитать поток метрик",
        details: (error as Error).message
      },
      { status: 200 }
    );
  }
}
