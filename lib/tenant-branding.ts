import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const IMAGE_DATA_URI_PREFIX_REGEX = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i;
const GENERIC_DATA_URI_PREFIX_REGEX = /^data:[^;]+;base64,/i;

export function normalizeLogoDataUri(logoBase64: string | null): string | null {
  if (!logoBase64) return null;

  const compact = logoBase64.trim().replace(/\s+/g, "");
  if (!compact) return null;

  if (IMAGE_DATA_URI_PREFIX_REGEX.test(compact) || GENERIC_DATA_URI_PREFIX_REGEX.test(compact)) {
    return compact;
  }

  return `data:image/png;base64,${compact}`;
}

export async function getTenantLogoBase64(): Promise<string | null> {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { logoBase64: true },
  });

  return normalizeLogoDataUri(tenant?.logoBase64 ?? null);
}

export async function getTenantEmailBranding(): Promise<{ clinicLogoBase64: string | null; tenantName: string | null }> {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { logoBase64: true, nombre: true },
  });

  return {
    clinicLogoBase64: normalizeLogoDataUri(tenant?.logoBase64 ?? null),
    tenantName: tenant?.nombre?.trim() || null,
  };
}
