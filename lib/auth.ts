export const AUTH_COOKIE_NAME = "dashboard_token";
const DEFAULT_MAX_AGE = 60 * 60 * 12; // 12 часов

function getJwtSecret() {
  const secret = process.env.DASHBOARD_JWT_SECRET;
  if (!secret) {
    throw new Error("DASHBOARD_JWT_SECRET не задан. Добавьте его в .env");
  }
  return secret;
}

function getSessionMaxAge() {
  const raw = Number(process.env.DASHBOARD_SESSION_MAX_AGE);
  if (Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return DEFAULT_MAX_AGE;
}

export async function signAuthToken(payload: Record<string, unknown> = {}) {
  const header = { alg: "HS256", typ: "JWT" };
  const maxAge = getSessionMaxAge();
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAge
  };

  const headerSegment = base64UrlEncode(encodeJson(header));
  const payloadSegment = base64UrlEncode(encodeJson(body));
  const data = `${headerSegment}.${payloadSegment}`;
  const signature = await hmacSha256(data, getJwtSecret());
  const signatureSegment = base64UrlEncode(signature);

  return `${data}.${signatureSegment}`;
}

export async function verifyAuthToken(token: string) {
  const [headerSegment, payloadSegment, signatureSegment] = token.split(".");
  if (!headerSegment || !payloadSegment || !signatureSegment) {
    throw new Error("Некорректный токен");
  }

  const data = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = await hmacSha256(data, getJwtSecret());
  const signatureBuffer = base64UrlDecode(signatureSegment);
  if (!timingSafeEqual(signatureBuffer, expectedSignature)) {
    throw new Error("Неверная подпись токена");
  }

  const payload = JSON.parse(decodeJson(base64UrlDecode(payloadSegment)));
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Срок действия токена истёк");
  }
  return payload;
}

type CookieOptionsOverride = {
  secure?: boolean;
};

export function getCookieOptions(overrides: CookieOptionsOverride = {}) {
  const maxAge = getSessionMaxAge();
  return {
    name: AUTH_COOKIE_NAME,
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
    httpOnly: true,
    secure: overrides.secure ?? process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/"
  };
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function encodeJson(value: unknown) {
  return textEncoder.encode(JSON.stringify(value));
}

function decodeJson(bytes: Uint8Array) {
  return textDecoder.decode(bytes);
}

function base64UrlEncode(bytes: Uint8Array) {
  return base64Encode(bytes)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return base64Decode(padded);
}

function base64Encode(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Decode(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSha256(data: string, secret: string) {
  const crypto = getCrypto();
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
  const result = await crypto.subtle.sign("HMAC", key, textEncoder.encode(data));
  return new Uint8Array(result);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i];
    const bi = b[i];
    diff |= ai ^ bi;
  }
  return diff === 0;
}

function getCrypto() {
  if (typeof globalThis.crypto?.subtle !== "undefined") {
    return globalThis.crypto;
  }
  throw new Error("Web Crypto API недоступен в текущем окружении");
}
