const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function sanitizeHostname(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

function normalizeRootDomain(rootDomain: string): string {
  return rootDomain.replace(/^\./, "").toLowerCase();
}

export function resolveTenantSlugFromHost(host: string | null, rootDomain = process.env.ROOT_DOMAIN): string | null {
  if (!host) return null;

  const hostname = sanitizeHostname(host);
  if (!hostname) return null;

  const labels = hostname.split(".").filter(Boolean);
  if (labels.length < 2) return null;

  if (LOCALHOST_HOSTNAMES.has(labels[labels.length - 1]) && labels.length >= 2) {
    const candidate = labels[0];
    return candidate && !LOCALHOST_HOSTNAMES.has(candidate) ? candidate : null;
  }

  if (!rootDomain) {
    return labels.length > 2 ? labels[0] : null;
  }

  const normalizedRoot = normalizeRootDomain(rootDomain);

  if (hostname === normalizedRoot || hostname === `www.${normalizedRoot}`) {
    return null;
  }

  if (!hostname.endsWith(`.${normalizedRoot}`)) {
    return null;
  }

  const subdomainPart = hostname.slice(0, hostname.length - normalizedRoot.length - 1);
  const slug = subdomainPart.split(".")[0];

  if (!slug || slug === "www") return null;
  return slug;
}
