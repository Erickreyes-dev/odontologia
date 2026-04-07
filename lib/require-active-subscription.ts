import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveSubscriptionStatus } from "@/lib/subscription-status";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const EXEMPT_PREFIXES = ["/billing", "/dashboard-admin", "/tenants", "/paquetes"];

function getCurrentPathname(): string {
  const requestHeaders = headers();
  const rawPathname = requestHeaders.get("x-pathname");
  if (rawPathname) return rawPathname;

  const rawNextUrl = requestHeaders.get("next-url");
  if (rawNextUrl) {
    try {
      return new URL(rawNextUrl, "http://localhost").pathname;
    } catch {
      return "/";
    }
  }

  return "/";
}

export async function requireActiveSubscription(): Promise<void> {
  const session = await getSession();
  if (!session?.TenantId) return;

  const pathname = getCurrentPathname();
  const isExempt = EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isExempt) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.TenantId },
    select: {
      id: true,
      activo: true,
      estado: true,
      trialEndsAt: true,
      fechaExpiracion: true,
      proximoPago: true,
    },
  });

  if (!tenant) return;

  const status = resolveSubscriptionStatus({
    tenantActivo: tenant.activo,
    trialEndsAt: tenant.trialEndsAt,
    fechaExpiracion: tenant.fechaExpiracion,
    proximoPago: tenant.proximoPago,
  });

  if (tenant.estado !== status) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { estado: status },
    });
  }

  if (status !== "vigente") {
    redirect("/billing?subscription=required");
  }
}
