import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import YAML from "yaml";

const CONFIG_PATH = path.resolve(process.cwd(), "../config.yaml");

export async function GET() {
  try {
    const content = await fs.readFile(CONFIG_PATH, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Не удалось прочитать config.yaml", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { content?: string };
    if (typeof body?.content !== "string") {
      return NextResponse.json({ error: "Поле content обязательно" }, { status: 400 });
    }

    try {
      YAML.parse(body.content);
    } catch (error) {
      return NextResponse.json(
        { error: "Некорректный YAML", details: (error as Error).message },
        { status: 400 }
      );
    }

    await fs.writeFile(CONFIG_PATH, body.content, "utf-8");
    return NextResponse.json({ success: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: "Не удалось сохранить config.yaml", details: (error as Error).message },
      { status: 500 }
    );
  }
}
