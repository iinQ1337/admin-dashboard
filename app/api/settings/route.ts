import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import YAML from "yaml";

const CONFIG_PATH = path.resolve(process.cwd(), "../config.yaml");

function sanitizePayload(payload: any) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Некорректное тело запроса");
  }
  const { notifications, polling, alerts, dashboard } = payload;
  if (!notifications || !polling || !alerts) {
    throw new Error("Отсутствуют обязательные секции notifications/polling/alerts");
  }
  if (!dashboard || typeof dashboard !== "object") {
    throw new Error("Отсутствует секция dashboard");
  }
  return { notifications, polling, alerts, dashboard };
}

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = YAML.parse(raw) ?? {};
    return NextResponse.json({
      notifications: config.notifications ?? null,
      polling: config.polling ?? null,
      alerts: config.alerts ?? null,
      dashboard: config.dashboard ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Не удалось прочитать config.yaml", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { notifications, polling, alerts, dashboard } = sanitizePayload(body);
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const doc = YAML.parseDocument(raw);
    doc.set("notifications", notifications);
    doc.set("polling", polling);
    doc.set("alerts", alerts);
    doc.set("dashboard", dashboard);
    await fs.writeFile(CONFIG_PATH, doc.toString(), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Не удалось сохранить config.yaml", details: (error as Error).message },
      { status: 500 }
    );
  }
}
