"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { capturePaypalOrder, createPaypalOrder } from "@/lib/paypal";
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

function calculateAmountByPeriod(paquete: {
  precio: unknown;
  precioTrimestral: unknown;
  precioSemestral: unknown;
  precioAnual: unknown;
}, periodoPlan: "mensual" | "trimestral" | "semestral" | "anual") {
  const mensual = Number(paquete.precio ?? 0);
  if (periodoPlan === "trimestral") return Number(paquete.precioTrimestral ?? mensual * 3);
  if (periodoPlan === "semestral") return Number(paquete.precioSemestral ?? mensual * 6);
  if (periodoPlan === "anual") return Number(paquete.precioAnual ?? mensual * 12);
  return mensual;
}

function getNextBillingDate(periodoPlan: "mensual" | "trimestral" | "semestral" | "anual") {
  const next = new Date();
  const monthsToAdd = periodoPlan === "mensual" ? 1 : periodoPlan === "trimestral" ? 3 : periodoPlan === "semestral" ? 6 : 12;
  next.setMonth(next.getMonth() + monthsToAdd);
  return next;
}

export async function createCheckoutForPlan(periodoPlan: "mensual" | "trimestral" | "semestral" | "anual") {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.TenantId },
    include: { paquete: true },
  });

  if (!tenant?.paquete) return { success: false as const, error: "No hay paquete activo" };

  try {
    const monto = calculateAmountByPeriod(tenant.paquete, periodoPlan);
    const order = await createPaypalOrder(monto, `Plan ${tenant.paquete.nombre} (${periodoPlan})`, tenant.slug);
    const approveLink = order.links?.find((link: any) => link.rel === "approve")?.href;

    if (!approveLink) {
      return { success: false as const, error: "PayPal no devolvió el enlace de aprobación. Intenta de nuevo." };
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { periodoPlan, paypalCustomerId: order.id },
    });

    revalidatePath("/billing");

    return { success: true as const, approveLink };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "No se pudo iniciar el pago con PayPal",
    };
  }
}

export async function capturePaypalAndCreateInvoice(orderId: string) {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.TenantId },
    include: { paquete: true },
  });

  if (!tenant?.paquete) return { success: false as const, error: "No hay paquete activo" };
  if (!orderId) return { success: false as const, error: "Orden de PayPal inválida" };

  const alreadyCaptured = await prisma.tenantInvoice.findFirst({
    where: { tenantId: session.TenantId, paypalOrderId: orderId, estado: "pagada" },
  });
  if (alreadyCaptured) {
    return { success: true as const };
  }

  try {
    const captured = await capturePaypalOrder(orderId);
    const captureId = captured?.purchase_units?.[0]?.payments?.captures?.[0]?.id as string | undefined;
    const status = String(captured?.status ?? "");

    if (!captureId || status !== "COMPLETED") {
      return { success: false as const, error: "PayPal no confirmó la captura del pago" };
    }

    const periodoPlan = (tenant.periodoPlan || "mensual") as "mensual" | "trimestral" | "semestral" | "anual";
    const monto = calculateAmountByPeriod(tenant.paquete, periodoPlan);
    const nextBillingDate = getNextBillingDate(periodoPlan);

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          proximoPago: nextBillingDate,
          trialEndsAt: null,
          paypalCustomerId: null,
        },
      });

      await tx.tenantInvoice.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          paqueteId: tenant.paquete!.id,
          periodoPlan,
          monto,
          subtotal: monto,
          impuesto: 0,
          total: monto,
          moneda: "USD",
          estado: "pagada",
          numeroFactura: `INV-${Date.now()}`,
          facturarNombre: tenant.contactoNombre,
          facturarCorreo: tenant.contactoCorreo,
          facturarTelefono: tenant.telefono,
          facturarPais: tenant.paisCodigo,
          descripcion: `Suscripción ${tenant.paquete!.nombre} (${periodoPlan})`,
          paypalOrderId: orderId,
          paypalCaptureId: captureId,
          fechaPago: new Date(),
        },
      });
    });

    revalidatePath("/billing");

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error al confirmar pago con PayPal",
    };
  }
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
