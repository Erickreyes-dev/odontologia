const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeRootHost(host: string): string {
  return host.trim().toLowerCase().replace(/^\./, "").replace(/^www\./, "");
}

function getPlatformOrigin(): URL {
  const raw =
    process.env.PLATFORM_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  return new URL(raw);
}

function getRootHost(origin: URL): string {
  if (process.env.ROOT_DOMAIN) {
    return normalizeRootHost(process.env.ROOT_DOMAIN);
  }

  return normalizeRootHost(origin.hostname);
}

export function buildTenantLoginUrl(slug: string): string {
  const origin = getPlatformOrigin();
  const normalizedSlug = slug.trim().toLowerCase();
  const rootHost = getRootHost(origin);

  const host = LOCAL_HOSTS.has(rootHost)
    ? `${normalizedSlug}.${rootHost}`
    : `${normalizedSlug}.${rootHost}`;

  const port = origin.port ? `:${origin.port}` : "";
  return `${origin.protocol}//${host}${port}/login`;
}
