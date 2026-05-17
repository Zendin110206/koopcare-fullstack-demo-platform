import type { RequestHandler } from "express";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type DemoAuthRole = "member" | "admin";

export type DemoAuthSession = {
  role: DemoAuthRole;
  displayName: string;
  issuedAt: string;
  expiresAt: string;
};

type DemoTokenPayload = {
  displayName: string;
  exp: number;
  iat: number;
  role: DemoAuthRole;
  sub: string;
};

const defaultPasswords: Record<DemoAuthRole, string> = {
  admin: "admin-demo-2026",
  member: "member-demo-2026"
};

const displayNames: Record<DemoAuthRole, string> = {
  admin: "Demo Cooperative Officer",
  member: "Demo Member"
};

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getTokenTtlSeconds() {
  return parsePositiveNumber(process.env.DEMO_AUTH_TOKEN_TTL_SECONDS, 60 * 60 * 8);
}

function getAuthSecret() {
  return process.env.DEMO_AUTH_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "koopcare-demo-auth-development-secret";
}

function isDemoAuthRole(value: unknown): value is DemoAuthRole {
  return value === "member" || value === "admin";
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function signTokenPayload(encodedPayload: string) {
  return createHmac("sha256", getAuthSecret()).update(encodedPayload).digest("base64url");
}

function secureCompare(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();

  return timingSafeEqual(leftHash, rightHash);
}

function getExpectedPassword(role: DemoAuthRole) {
  if (role === "admin") {
    return process.env.DEMO_ADMIN_PASSWORD?.trim() || defaultPasswords.admin;
  }

  return process.env.DEMO_MEMBER_PASSWORD?.trim() || defaultPasswords.member;
}

function toSession(payload: DemoTokenPayload): DemoAuthSession {
  return {
    displayName: payload.displayName,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    role: payload.role
  };
}

function createDemoToken(role: DemoAuthRole) {
  const issuedAtSeconds = Math.floor(Date.now() / 1000);
  const tokenTtlSeconds = getTokenTtlSeconds();
  const payload: DemoTokenPayload = {
    displayName: displayNames[role],
    exp: issuedAtSeconds + tokenTtlSeconds,
    iat: issuedAtSeconds,
    role,
    sub: `koopcare-demo-${role}`
  };
  const encodedPayload = encodeJson(payload);
  const signature = signTokenPayload(encodedPayload);

  return {
    session: toSession(payload),
    token: `${encodedPayload}.${signature}`
  };
}

export function authenticateDemoLogin(role: unknown, password: unknown) {
  if (!isDemoAuthRole(role) || typeof password !== "string") {
    return null;
  }

  if (!secureCompare(password, getExpectedPassword(role))) {
    return null;
  }

  return createDemoToken(role);
}

export function readDemoSession(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !secureCompare(signature, signTokenPayload(encodedPayload))) {
    return null;
  }

  const payload = decodeJson<DemoTokenPayload>(encodedPayload);

  if (!payload || !isDemoAuthRole(payload.role) || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return toSession(payload);
}

export function requireDemoAuth(allowedRoles: DemoAuthRole[]): RequestHandler {
  return (request, response, next) => {
    const session = readDemoSession(request.headers.authorization);

    if (!session) {
      response.status(401).json({
        error: "Unauthorized",
        message: "Demo login is required for this action."
      });
      return;
    }

    if (!allowedRoles.includes(session.role)) {
      response.status(403).json({
        error: "Forbidden",
        message: "This demo account is not allowed to perform this action."
      });
      return;
    }

    next();
  };
}

export function getDemoAuthSummary() {
  return {
    mode: "demo_role_gate",
    roles: ["member", "admin"] as const,
    token_ttl_seconds: getTokenTtlSeconds()
  };
}
