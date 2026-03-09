import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function getTenantLogoBase64(): Promise<string | null> {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { logoBase64: true },
  });

  return tenant?.logoBase64 ?? null;
}
