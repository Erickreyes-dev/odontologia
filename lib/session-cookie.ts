const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^\./, "").replace(/^www\./, "").split("/")[0].split(":")[0];
}

function resolveRootHost(): string | null {
  const fromRootDomain = process.env.ROOT_DOMAIN?.trim();
  if (fromRootDomain) {
    return normalizeHost(fromRootDomain);
  }

  const fromPlatformUrl = process.env.PLATFORM_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (fromPlatformUrl) {
    try {
      return normalizeHost(new URL(fromPlatformUrl).hostname);
    } catch {
      return normalizeHost(fromPlatformUrl);
    }
  }

  return null;
}

export function getSessionCookieDomain(): string | undefined {
  const rootHost = resolveRootHost();
  if (!rootHost) return undefined;

  // Browsers reject Domain=.localhost and related local development domains.
  // In local/dev contexts we must omit `domain` and let the cookie be host-only.
  const isLocalDomain =
    LOCAL_HOSTS.has(rootHost) ||
    rootHost.endsWith(".localhost") ||
    rootHost.endsWith(".local") ||
    rootHost.endsWith(".test");

  if (isLocalDomain) return undefined;
  return `.${rootHost}`;
}
