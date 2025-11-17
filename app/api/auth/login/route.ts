import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getCookieOptions, signAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json({ error: "Пароль не настроен. Задайте DASHBOARD_PASSWORD" }, { status: 500 });
  }

  if (!password) {
    return NextResponse.json({ error: "Введите пароль" }, { status: 400 });
  }

  if (password !== expectedPassword) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const token = await signAuthToken({ sub: "dashboard" });
  const response = NextResponse.json({ success: true });

  const cookieOptions = getCookieOptions({ secure: isSecureRequest(request) });
  response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);

  return response;
}

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    const proto = forwardedProto.split(",")[0]?.trim().toLowerCase();
    if (proto) {
      return proto === "https";
    }
  }
  const forwardedHeader = request.headers.get("forwarded");
  if (forwardedHeader) {
    const match = forwardedHeader.match(/proto=(https?)/i);
    if (match?.[1]) {
      return match[1].toLowerCase() === "https";
    }
  }
  return new URL(request.url).protocol === "https:";
}
