import { prisma } from "@/lib/prisma";
import { resolveCurrencyByCountry } from "@/lib/country-currency";

export async function getTenantCurrency(tenantId: string | null | undefined) {
  if (!tenantId) return resolveCurrencyByCountry("HN");
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { monedaCodigo: true, paisCodigo: true },
  });

  if (tenant?.monedaCodigo) {
    const info = resolveCurrencyByCountry(tenant.paisCodigo);
    return { ...info, currency: tenant.monedaCodigo };
  }

  return resolveCurrencyByCountry(tenant?.paisCodigo);
}
