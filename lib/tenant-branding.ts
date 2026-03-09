import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const DATA_URI_PREFIX_REGEX = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

function normalizeLogoDataUri(logoBase64: string | null): string | null {
  if (!logoBase64) return null;

  const trimmed = logoBase64.trim();
  if (!trimmed) return null;

  if (DATA_URI_PREFIX_REGEX.test(trimmed)) {
    return trimmed;
  }

  return `data:image/png;base64,${trimmed}`;
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
