import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { TENANT_PERMISSIONS } from "@/lib/permission-catalog";
import { calculateExpirationDateByPlan, resolveSubscriptionStatus } from "@/lib/subscription-status";
import { capturePaypalOrder, getPaypalOrder } from "@/lib/paypal";

type PeriodoPlan = "mensual" | "trimestral" | "semestral" | "anual";

function usernameFromEmail(email: string) {
  return email.split("@")[0].slice(0, 50);
}

export async function finalizeOnboardingProvision(orderId: string): Promise<{
  success: boolean;
  error?: string;
  tenantId?: string;
  tenantSlug?: string;
  userId?: string;
}> {
  if (!orderId) return { success: false, error: "Orden de PayPal inválida" };

  const invoice = await prisma.tenantInvoice.findFirst({
    where: { paypalOrderId: orderId },
    include: { tenant: true, paquete: true },
  });
  if (!invoice?.tenant) return { success: false, error: "No existe pre-suscripción para esta orden" };

  let captured: unknown;
  try {
    captured = await capturePaypalOrder(orderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("ORDER_ALREADY_CAPTURED")
      || message.includes("UNPROCESSABLE_ENTITY")
      || message.includes("RESOURCE_CONFLICT")
    ) {
      captured = await getPaypalOrder(orderId);
    } else {
      throw error;
    }
  }

  const paypalPayload = captured as {
    status?: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{ id?: string; status?: string }>;
        authorizations?: Array<{ id?: string; status?: string }>;
      };
    }>;
  };

  const capture = paypalPayload.purchase_units?.[0]?.payments?.captures?.[0];
  const authorization = paypalPayload.purchase_units?.[0]?.payments?.authorizations?.[0];
  const captureId = capture?.id ?? authorization?.id;
  const status = String(paypalPayload.status ?? "");
  const captureStatus = String(capture?.status ?? authorization?.status ?? "");
  const isPaid = ["COMPLETED", "APPROVED"].includes(status) || ["COMPLETED", "APPROVED"].includes(captureStatus);

  if (!captureId || !isPaid) {
    return { success: false, error: "PayPal no confirmó el pago de la orden" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const freshInvoice = await tx.tenantInvoice.findUnique({
      where: { id: invoice.id },
      include: { tenant: { include: { usuarios: true } }, paquete: true },
    });
    if (!freshInvoice?.tenant) throw new Error("No se encontró la pre-suscripción");

    const tenant = freshInvoice.tenant;
    const periodoPlan = (tenant.periodoPlan || "mensual") as PeriodoPlan;
    const nextBillingDate = calculateExpirationDateByPlan(periodoPlan);

    await tx.tenantInvoice.update({
      where: { id: freshInvoice.id },
      data: {
        estado: "pagada",
        fechaPago: new Date(),
        paypalCaptureId: captureId,
      },
    });

    let tenantAdmin = tenant.usuarios[0] ?? null;
    if (!tenant.activo || !tenantAdmin) {
      const existingPermisos = await tx.permiso.findMany({ where: { tenantId: tenant.id } });
      const permisos = existingPermisos.length > 0 ? existingPermisos : await Promise.all(
        TENANT_PERMISSIONS.map((permission) => tx.permiso.create({
          data: {
            id: randomUUID(),
            tenantId: tenant.id,
            nombre: permission.nombre,
            descripcion: permission.descripcion,
            activo: true,
          },
        })),
      );

      let adminRole = await tx.rol.findFirst({
        where: { tenantId: tenant.id, nombre: "AdministradorTenant" },
      });

      if (!adminRole) {
        adminRole = await tx.rol.create({
          data: {
            id: randomUUID(),
            tenantId: tenant.id,
            nombre: "AdministradorTenant",
            descripcion: "Administrador principal del tenant",
            activo: true,
          },
        });
      }

      for (const permiso of permisos) {
        const exists = await tx.rolPermiso.findFirst({
          where: { rolId: adminRole.id, permisoId: permiso.id },
          select: { id: true },
        });
        if (!exists) {
          await tx.rolPermiso.create({
            data: { id: randomUUID(), rolId: adminRole.id, permisoId: permiso.id },
          });
        }
      }

      if (!tenantAdmin) {
        const correo = tenant.contactoCorreo?.toLowerCase();
        if (!correo) throw new Error("La pre-suscripción no tiene correo de contacto");

        const baseUser = usernameFromEmail(correo);
        let usuario = baseUser;
        let usernameAttempt = 1;
        while (await tx.usuarios.findUnique({ where: { tenantId_usuario: { tenantId: tenant.id, usuario } } })) {
          usuario = `${baseUser}${usernameAttempt}`.slice(0, 50);
          usernameAttempt += 1;
        }

        tenantAdmin = await tx.usuarios.create({
          data: {
            id: randomUUID(),
            tenantId: tenant.id,
            usuario,
            correo,
            contrasena: await bcrypt.hash(randomUUID(), 10),
            empleado_id: null,
            rol_id: adminRole.id,
            activo: true,
            DebeCambiarPassword: false,
          },
        });
      }
    }

    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        activo: true,
        trialEndsAt: null,
        proximoPago: nextBillingDate,
        fechaExpiracion: nextBillingDate,
        estado: resolveSubscriptionStatus({ tenantActivo: true, fechaExpiracion: nextBillingDate }),
        paypalCustomerId: null,
      },
    });

    return { tenantId: tenant.id, tenantSlug: tenant.slug, userId: tenantAdmin?.id };
  });

  return { success: true, ...result };
}
