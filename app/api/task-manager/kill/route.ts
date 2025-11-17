import { NextResponse } from "next/server";

const ALLOWED_SIGNALS = new Set<NodeJS.Signals>(["SIGTERM", "SIGKILL", "SIGINT"]);
const PROTECTED_PIDS = new Set<number>([process.pid, 1]);

type KillBody = {
  pid?: number | string;
  signal?: string;
};

function resolvePid(value: KillBody["pid"]): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function resolveSignal(raw: KillBody["signal"]): NodeJS.Signals {
  if (typeof raw === "string") {
    const upper = raw.toUpperCase() as NodeJS.Signals;
    if (ALLOWED_SIGNALS.has(upper)) {
      return upper;
    }
  }
  return "SIGTERM";
}

export async function POST(request: Request) {
  let body: KillBody;
  try {
    body = (await request.json()) as KillBody;
  } catch {
    return NextResponse.json({ success: false, error: "Некорректное тело запроса" }, { status: 400 });
  }

  const pid = resolvePid(body?.pid);
  if (!pid) {
    return NextResponse.json({ success: false, error: "Укажите корректный PID" }, { status: 400 });
  }
  if (PROTECTED_PIDS.has(pid)) {
    return NextResponse.json({ success: false, error: "Этот процесс защищён от завершения" }, { status: 403 });
  }

  const signal = resolveSignal(body?.signal);

  try {
    process.kill(pid, signal);
    return NextResponse.json({ success: true, pid, signal });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    const status = err.code === "ESRCH" ? 404 : err.code === "EPERM" ? 403 : 500;
    const message =
      err.code === "ESRCH"
        ? "Процесс не найден"
        : err.code === "EPERM"
          ? "Недостаточно прав для завершения процесса"
          : err.message || "Не удалось завершить процесс";
    return NextResponse.json({ success: false, error: message, pid }, { status });
  }
}
