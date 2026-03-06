/* eslint-disable @typescript-eslint/ban-ts-comment */
import { jwtVerify, type JWTPayload } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveTenantSlugFromHost } from "@/lib/tenant-host";

type Bucket = { count: number; reset: number };
type RateLimitConfig = { limit: number; windowMs: number };

interface SessionPayload extends JWTPayload {
  Permiso?: string[];
}

const authSecret = process.env.AUTH_SECRET
  ? new TextEncoder().encode(process.env.AUTH_SECRET)
  : null;

async function getSessionPermissions(req: NextRequest): Promise<string[] | null> {
  const token =
    req.cookies.get("session")?.value ??
    req.cookies.get("next-auth.session-token")?.value ??
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!token) return [];

  if (!authSecret) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, authSecret, { algorithms: ["HS256"] });
    return Array.isArray(payload.Permiso) ? payload.Permiso : [];
  } catch {
    return null;
  }
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = { limit: 120, windowMs: 60_000 };

const ROUTE_RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/auth": { limit: 20, windowMs: 60_000 },
  "/api": { limit: 80, windowMs: 60_000 },
  "/dashboard-admin": { limit: 90, windowMs: 60_000 },
  "/dashboard": { limit: 120, windowMs: 60_000 },
  "/citas": { limit: 90, windowMs: 60_000 },
  "/pacientes": { limit: 80, windowMs: 60_000 },
  "/medicos": { limit: 80, windowMs: 60_000 },
  "/servicios": { limit: 80, windowMs: 60_000 },
  "/cotizaciones": { limit: 70, windowMs: 60_000 },
  "/planes-tratamiento": { limit: 70, windowMs: 60_000 },
  "/pagos": { limit: 60, windowMs: 60_000 },
  "/ordenes-cobro": { limit: 60, windowMs: 60_000 },
  "/inventario": { limit: 80, windowMs: 60_000 },
  "/consultorios": { limit: 80, windowMs: 60_000 },
  "/seguros": { limit: 80, windowMs: 60_000 },
  "/roles": { limit: 70, windowMs: 60_000 },
  "/permisos": { limit: 70, windowMs: 60_000 },
  "/usuarios": { limit: 70, windowMs: 60_000 },
  "/empleados": { limit: 70, windowMs: 60_000 },
  "/puestos": { limit: 70, windowMs: 60_000 },
  "/profesiones": { limit: 70, windowMs: 60_000 },
  "/protected": { limit: 50, windowMs: 60_000 },
};

const rateMap: Map<string, Bucket> =
  // @ts-ignore
  globalThis.__RATE_LIMIT_MAP ?? new Map();
// @ts-ignore
if (!globalThis.__RATE_LIMIT_MAP) globalThis.__RATE_LIMIT_MAP = rateMap;

function getClientIp(req: NextRequest): string {
  const header = req.headers;
  const xff = header.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xReal = header.get("x-real-ip");
  if (xReal) return xReal;
  const cf = header.get("cf-connecting-ip");
  if (cf) return cf;
  const vercel = header.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  return "unknown";
}

function getRateLimitConfigWithPrefix(pathname: string): { prefix: string; config: RateLimitConfig } {
  const sortedEntries = Object.entries(ROUTE_RATE_LIMITS).sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, config] of sortedEntries) {
    if (pathname.startsWith(prefix)) return { prefix, config };
  }
  return { prefix: "default", config: DEFAULT_RATE_LIMIT };
}

function shouldSkipRateLimit(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/uploads")
  );
}

function isRateLimited(key: string, config: RateLimitConfig) {
  const now = Date.now();
  const current = rateMap.get(key);

  if (!current || current.reset <= now) {
    rateMap.set(key, { count: 1, reset: now + config.windowMs });
    return { limited: false, retryAfter: 0 };
  }

  current.count += 1;

  if (current.count > config.limit) {
    const retryAfterSeconds = Math.ceil((current.reset - now) / 1000);
    return { limited: true, retryAfter: Math.max(retryAfterSeconds, 1) };
  }

  return { limited: false, retryAfter: 0 };
}

function cleanupExpiredEntries(now: number) {
  rateMap.forEach((bucket, key) => {
    if (bucket.reset <= now) rateMap.delete(key);
  });
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const tenantSlugFromHost = resolveTenantSlugFromHost(req.headers.get("host"));
  const requestHeaders = new Headers(req.headers);

  if (tenantSlugFromHost) {
    requestHeaders.set("x-tenant-slug", tenantSlugFromHost);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!shouldSkipRateLimit(path)) {
    const clientIp = getClientIp(req);
    const { prefix, config } = getRateLimitConfigWithPrefix(path);
    const identifier = `${clientIp}:${prefix}`;

    cleanupExpiredEntries(Date.now());

    const { limited, retryAfter } = isRateLimited(identifier, config);
    if (limited) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Has excedido el límite de solicitudes. Intenta nuevamente en unos segundos.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.limit),
          },
        },
      );
    }
  }

  const sessionCookie =
    req.cookies.get("next-auth.session-token") ??
    req.cookies.get("__Secure-next-auth.session-token") ??
    req.cookies.get("session");

  const protectedPrefixes = [
    "/dashboard",
    "/dashboard-admin",
    "/seguros",
    "/pacientes",
    "/medicos",
    "/servicios",
    "/inventario",
    "/consultorios",
    "/citas",
    "/cotizaciones",
    "/planes-tratamiento",
    "/pagos",
    "/ordenes-cobro",
    "/roles",
    "/permisos",
    "/usuarios",
    "/empleados",
    "/puestos",
    "/profesiones",
    "/profile",
    "/protected",
  ];

  const isProtectedRoute = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (path.startsWith("/dashboard-admin")) {
    const permisos = await getSessionPermissions(req);

    if (permisos) {
      const canAccessAdminDashboard =
        permisos.includes("ver_dashboard_admin") && permisos.includes("gestionar_tenants");

      if (!canAccessAdminDashboard) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|uploads).*)"],
};
