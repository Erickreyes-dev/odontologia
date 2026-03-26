"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPaypalOrder } from "@/lib/paypal";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export async function getTenantBilling() {
  const session = await getSession();
  if (!session?.TenantId) return null;

  return prisma.tenant.findUnique({
    where: { id: session.TenantId },
    include: {
      paquete: true,
      tenantInvoices: { orderBy: { createAt: "desc" }, take: 10 },
    },
  });
}

export async function createCheckoutForLatestInvoice() {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  const invoice = await prisma.tenantInvoice.findFirst({
    where: { tenantId: session.TenantId, estado: "pendiente" },
    orderBy: { createAt: "desc" },
    include: { paquete: true },
  });

  if (!invoice) return { success: false as const, error: "No hay facturas pendientes" };

  const order = await createPaypalOrder(Number(invoice.monto), `Plan ${invoice.paquete.nombre} (${invoice.periodoPlan})`);
  const approveLink = order.links?.find((link: any) => link.rel === "approve")?.href;

  await prisma.tenantInvoice.update({
    where: { id: invoice.id },
    data: { paypalOrderId: order.id },
  });

  revalidatePath("/billing");

  return { success: true as const, approveLink };
}

export async function markInvoiceAsPaid(invoiceId: string, captureId: string) {
  await prisma.tenantInvoice.update({
    where: { id: invoiceId },
    data: { estado: "pagada", paypalCaptureId: captureId, fechaPago: new Date() },
  });

  revalidatePath("/billing");
  return { success: true as const };
}

export async function createNewTenantInvoice(periodoPlan: "trimestral" | "semestral" | "anual") {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  const tenant = await prisma.tenant.findUnique({ where: { id: session.TenantId }, include: { paquete: true } });
  if (!tenant?.paquete) return { success: false as const, error: "No hay paquete activo" };

  const paquete = tenant.paquete;
  const monto = periodoPlan === "trimestral"
    ? Number(paquete.precioTrimestral ?? paquete.precio)
    : periodoPlan === "semestral"
      ? Number(paquete.precioSemestral ?? paquete.precio)
      : Number(paquete.precioAnual ?? paquete.precio);

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({ where: { id: tenant.id }, data: { periodoPlan } });
    await tx.tenantInvoice.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        paqueteId: paquete.id,
        periodoPlan,
        monto,
        moneda: "USD",
        estado: "pendiente",
      },
    });
  });

  revalidatePath("/billing");
  return { success: true as const };
}
