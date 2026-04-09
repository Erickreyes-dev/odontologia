"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildTenantLoginUrl } from "@/lib/tenant-url";
import { TENANT_PERMISSIONS } from "@/lib/permission-catalog";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { TenantCreateInput, TenantPlanUpdateInput, tenantCreateSchema, tenantPlanUpdateSchema } from "./schema";
import { resolveCurrencyByCountry } from "@/lib/country-currency";
import { calculateExpirationDateByPlan, resolveSubscriptionStatus } from "@/lib/subscription-status";

function calculatePackageAmountByPeriod(
  paquete: {
    precio: unknown;
    precioTrimestral: unknown;
    precioSemestral: unknown;
    precioAnual: unknown;
  },
  periodoPlan: string,
) {
  const mensual = Number(paquete.precio ?? 0);
  if (periodoPlan === "trimestral") return Number(paquete.precioTrimestral ?? mensual * 3);
  if (periodoPlan === "semestral") return Number(paquete.precioSemestral ?? mensual * 6);
  if (periodoPlan === "anual") return Number(paquete.precioAnual ?? mensual * 12);
  return mensual;
}

export async function getTenantsData() {
  const [paquetes, tenants, paidInvoices, pendingInvoices, pendingInvoiceTenants] = await Promise.all([
    prisma.paquete.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.tenant.findMany({
      take: 30,
      orderBy: { createAt: "desc" },
      include: {
        paquete: true,
        _count: { select: { usuarios: true, pacientes: true, roles: true } },
      },
    }),
    prisma.tenantInvoice.aggregate({
      _sum: { total: true, monto: true },
      _count: { _all: true },
      where: { estado: "pagada" },
    }),
    prisma.tenantInvoice.aggregate({
      _sum: { total: true, monto: true },
      _count: { _all: true },
      where: { estado: "pendiente" },
    }),
    prisma.tenantInvoice.findMany({
      where: { estado: "pendiente" },
      select: { tenantId: true },
      distinct: ["tenantId"],
    }),
  ]);

  const pendingTenantIds = new Set(pendingInvoiceTenants.map((invoice) => invoice.tenantId));
  const now = new Date();

  const missingPendingTenants = tenants.filter((tenant) => {
    const hasPendingInvoice = pendingTenantIds.has(tenant.id);
    const isTrialActive = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) > now : false;
    const isDueNow = tenant.proximoPago ? new Date(tenant.proximoPago) <= now : false;

    return tenant.activo && !isTrialActive && isDueNow && !hasPendingInvoice && Boolean(tenant.paquete);
  });

  const missingPendingAmount = missingPendingTenants.reduce((total, tenant) => {
    if (!tenant.paquete) return total;
    return total + calculatePackageAmountByPeriod(tenant.paquete, tenant.periodoPlan);
  }, 0);

  const allPendingTenantIds = new Set([...pendingTenantIds, ...missingPendingTenants.map((tenant) => tenant.id)]);
  const tenantsConPagoPendiente = tenants
    .filter((tenant) => allPendingTenantIds.has(tenant.id))
    .map((tenant) => ({
      id: tenant.id,
      nombre: tenant.nombre,
      slug: tenant.slug,
      proximoPago: tenant.proximoPago,
      contactoCorreo: tenant.contactoCorreo,
    }));

  return {
    paquetes,
    tenants,
    tenantsConPagoPendiente,
    metrics: {
      paidCount: paidInvoices._count._all,
      pendingCount: pendingInvoices._count._all + missingPendingTenants.length,
      ingresosTotales: Number(paidInvoices._sum.total ?? paidInvoices._sum.monto ?? 0),
      ingresosPendientes: Number(pendingInvoices._sum.total ?? pendingInvoices._sum.monto ?? 0) + missingPendingAmount,
    },
  };
}

export async function createTenant(
  input: TenantCreateInput,
): Promise<{ success: true; adminPassword: string; loginUrl: string } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_tenants")) {
      return { success: false, error: "No tiene permisos para crear tenants" };
    }

    const parsed = tenantCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const paquete = await prisma.paquete.findUnique({ where: { id: data.paqueteId } });
    if (!paquete || !paquete.activo) {
      return { success: false, error: "El paquete seleccionado no está disponible" };
    }

    const tenantSlugExists = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (tenantSlugExists) {
      return { success: false, error: "Ya existe un tenant con ese slug" };
    }

    const adminPassword = data.adminPassword?.trim().length
      ? data.adminPassword
      : randomBytes(9).toString("base64").slice(0, 12);

    await prisma.$transaction(async (tx) => {
      const trialEndsAt = paquete.trialActivo && paquete.trialDias > 0
        ? new Date(Date.now() + paquete.trialDias * 24 * 60 * 60 * 1000)
        : null;

      const tenant = await tx.tenant.create({
        data: {
          id: randomUUID(),
          nombre: data.nombre,
          slug: data.slug,
          plan: paquete.nombre,
          paqueteId: paquete.id,
          maxUsuarios: paquete.maxUsuarios,
          periodoPlan: data.periodoPlan,
          proximoPago: calculateExpirationDateByPlan(data.periodoPlan),
          contactoNombre: data.adminNombre,
          contactoCorreo: data.adminCorreo,
          paisCodigo: "HN",
          monedaCodigo: "HNL",
          trialEndsAt,
          fechaExpiracion: trialEndsAt ?? calculateExpirationDateByPlan(data.periodoPlan),
          estado: resolveSubscriptionStatus({ tenantActivo: true, trialEndsAt, fechaExpiracion: trialEndsAt ?? calculateExpirationDateByPlan(data.periodoPlan) }),
          activo: true,
        },
      });

      const tenantPermisos: { id: string; nombre: string }[] = [];
      for (const permission of TENANT_PERMISSIONS) {
        const created = await tx.permiso.create({
          data: {
            id: randomUUID(),
            nombre: permission.nombre,
            descripcion: permission.descripcion,
            activo: true,
          },
        });
        tenantPermisos.push({ id: created.id, nombre: created.nombre });
      }

      const adminRole = await tx.rol.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          nombre: "AdministradorTenant",
          descripcion: "Administrador principal del tenant",
          activo: true,
        },
      });

      for (const permiso of tenantPermisos) {
        await tx.rolPermiso.create({
          data: {
            id: randomUUID(),
            rolId: adminRole.id,
            permisoId: permiso.id,
          },
        });
      }

      const adminExists = await tx.usuarios.findFirst({
        where: { tenantId: tenant.id, usuario: data.adminUsuario },
      });
      if (adminExists) throw new Error("El usuario admin del tenant ya existe");

      await tx.usuarios.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          usuario: data.adminUsuario,
          contrasena: await bcrypt.hash(adminPassword, 10),
          empleado_id: null,
          rol_id: adminRole.id,
          activo: true,
          DebeCambiarPassword: true,
        },
      });

    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard-admin");
    return { success: true, adminPassword, loginUrl: buildTenantLoginUrl(data.slug) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error creando tenant" };
  }
}

export async function updateTenantPlan(
  input: TenantPlanUpdateInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_tenants")) {
      return { success: false, error: "No tiene permisos para editar tenants" };
    }

    const parsed = tenantPlanUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const paquete = await prisma.paquete.findUnique({ where: { id: data.paqueteId } });
    if (!paquete || !paquete.activo) {
      return { success: false, error: "El paquete seleccionado no está disponible" };
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId }, select: { paisCodigo: true } });

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: data.tenantId },
        data: {
          paqueteId: paquete.id,
          plan: paquete.nombre,
          maxUsuarios: paquete.maxUsuarios,
          periodoPlan: data.periodoPlan,
          proximoPago: calculateExpirationDateByPlan(data.periodoPlan),
          fechaExpiracion: data.fechaExpiracion,
          estado: data.estado,
          monedaCodigo: resolveCurrencyByCountry(tenant?.paisCodigo).currency,
        },
      });

    });

    revalidatePath("/tenants");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo actualizar el plan" };
  }
}

export async function deleteTenant(
  tenantId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_tenants")) {
      return { success: false, error: "No tiene permisos para eliminar tenants" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolPermiso.deleteMany({
        where: {
          OR: [
            { rol: { tenantId } },
          ],
        },
      });
      await tx.medicoServicio.deleteMany({
        where: {
          OR: [
            { medico: { tenantId } },
            { servicio: { tenantId } },
          ],
        },
      });

      await tx.reciboDetalle.deleteMany({ where: { tenantId } });
      await tx.recibo.deleteMany({ where: { tenantId } });
      await tx.cuotaFinanciamiento.deleteMany({ where: { tenantId } });
      await tx.pago.deleteMany({ where: { tenantId } });
      await tx.ordenDeCobro.deleteMany({ where: { tenantId } });
      await tx.consultaServicio.deleteMany({ where: { tenantId } });
      await tx.consultaProducto.deleteMany({ where: { tenantId } });
      await tx.planEtapaServicio.deleteMany({ where: { tenantId } });
      await tx.seguimiento.deleteMany({ where: { tenantId } });
      await tx.planEtapa.deleteMany({ where: { tenantId } });
      await tx.consulta.deleteMany({ where: { tenantId } });
      await tx.cita.deleteMany({ where: { tenantId } });
      await tx.constanciaMedica.deleteMany({ where: { tenantId } });
      await tx.financiamiento.deleteMany({ where: { tenantId } });
      await tx.planTratamiento.deleteMany({ where: { tenantId } });
      await tx.cotizacionServicio.deleteMany({ where: { tenantId } });
      await tx.cotizacion.deleteMany({ where: { tenantId } });
      await tx.promocionServicio.deleteMany({ where: { tenantId } });
      await tx.promocion.deleteMany({ where: { tenantId } });
      await tx.producto.deleteMany({ where: { tenantId } });
      await tx.servicio.deleteMany({ where: { tenantId } });
      await tx.consultorio.deleteMany({ where: { tenantId } });
      await tx.medico.deleteMany({ where: { tenantId } });
      await tx.paciente.deleteMany({ where: { tenantId } });
      await tx.seguro.deleteMany({ where: { tenantId } });
      await tx.profesion.deleteMany({ where: { tenantId } });
      await tx.usuarios.deleteMany({ where: { tenantId } });
      await tx.empleados.deleteMany({ where: { tenantId } });
      await tx.rol.deleteMany({ where: { tenantId } });
      await tx.puesto.deleteMany({ where: { tenantId } });
      await tx.tenantInvoice.deleteMany({ where: { tenantId } });
      await tx.solicitudCitaPublica.deleteMany({ where: { tenantId } });
      await tx.tenant.delete({ where: { id: tenantId } });
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard-admin");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2003") {
      return {
        success: false,
        error: "No se pudo eliminar el tenant por dependencias relacionadas. Intente nuevamente.",
      };
    }

    return { success: false, error: error instanceof Error ? error.message : "No se pudo eliminar el tenant" };
  }
}

export async function toggleTenantStatus(
  tenantId: string,
  activo: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_tenants")) {
      return { success: false, error: "No tiene permisos para gestionar tenants" };
    }

    await prisma.tenant.update({ where: { id: tenantId }, data: { activo } });
    revalidatePath("/tenants");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo actualizar el tenant" };
  }
}
