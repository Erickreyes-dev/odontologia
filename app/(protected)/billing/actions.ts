"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPaypalOrder } from "@/lib/paypal";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export interface BillingProfileInput {
  facturarNombre: string;
  facturarCorreo: string;
  facturarTelefono?: string;
  facturarTaxId?: string;
  facturarDireccion?: string;
  facturarCiudad?: string;
  facturarPais?: string;
  facturarPostal?: string;
}

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

export async function saveTenantBillingProfile(input: BillingProfileInput) {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  if (!input.facturarNombre.trim() || !input.facturarCorreo.includes("@")) {
    return { success: false as const, error: "Nombre y correo de facturación son obligatorios" };
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: session.TenantId } });
  if (!tenant) return { success: false as const, error: "Tenant no encontrado" };

  await prisma.tenant.update({
    where: { id: session.TenantId },
    data: {
      contactoNombre: input.facturarNombre.trim(),
      contactoCorreo: input.facturarCorreo.trim(),
      telefono: input.facturarTelefono?.trim() || tenant.telefono,
      paisCodigo: input.facturarPais?.trim() || tenant.paisCodigo,
    },
  });

  revalidatePath("/billing");
  return { success: true as const };
}

export async function markInvoiceAsPaid(invoiceId: string, captureId: string) {
  await prisma.tenantInvoice.update({
    where: { id: invoiceId },
    data: { estado: "pagada", paypalCaptureId: captureId, fechaPago: new Date() },
  });

  revalidatePath("/billing");
  return { success: true as const };
}

export async function createNewTenantInvoice(periodoPlan: "mensual" | "trimestral" | "semestral" | "anual") {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  const tenant = await prisma.tenant.findUnique({ where: { id: session.TenantId }, include: { paquete: true } });
  if (!tenant?.paquete) return { success: false as const, error: "No hay paquete activo" };

  const paquete = tenant.paquete;
  const monto = periodoPlan === "mensual"
    ? Number(paquete.precio)
    : periodoPlan === "trimestral"
      ? Number(paquete.precioTrimestral ?? Number(paquete.precio) * 3)
      : periodoPlan === "semestral"
        ? Number(paquete.precioSemestral ?? Number(paquete.precio) * 6)
        : Number(paquete.precioAnual ?? Number(paquete.precio) * 12);

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({ where: { id: tenant.id }, data: { periodoPlan } });
    await tx.tenantInvoice.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        paqueteId: paquete.id,
        periodoPlan,
        monto,
        subtotal: monto,
        impuesto: 0,
        total: monto,
        moneda: "USD",
        estado: "pendiente",
        numeroFactura: `INV-${Date.now()}`,
        facturarNombre: tenant.contactoNombre,
        facturarCorreo: tenant.contactoCorreo,
        facturarTelefono: tenant.telefono,
        facturarPais: tenant.paisCodigo,
        descripcion: `Suscripción ${paquete.nombre} (${periodoPlan})`,
      },
    });
  });

  revalidatePath("/billing");
  return { success: true as const };
}
