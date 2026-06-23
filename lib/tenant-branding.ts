import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/s3";
import { getTenantContext } from "@/lib/tenant";

export async function getTenantLogoBase64(): Promise<string | null> {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { logoPath: true },
  });

  return mediaUrl(tenant?.logoPath);
}

export async function getTenantEmailBranding(): Promise<{ clinicLogoBase64: string | null; tenantName: string | null }> {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { nombre: true },
  });

  return {
    clinicLogoBase64: null,
    tenantName: tenant?.nombre?.trim() || null,
  };
}
