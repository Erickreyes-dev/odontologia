"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildTenantLoginUrl } from "@/lib/tenant-url";
import { TENANT_PERMISSIONS } from "@/lib/permission-catalog";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { TenantCreateInput, TenantPlanUpdateInput, tenantCreateSchema, tenantPlanUpdateSchema } from "./schema";

function calculateNextPaymentDate(periodoPlan: string, baseDate = new Date()): Date {
  const next = new Date(baseDate);
  switch (periodoPlan) {
    case "mensual":
      next.setMonth(next.getMonth() + 1);
      break;
    case "trimestral":
      next.setMonth(next.getMonth() + 3);
      break;
    case "semestral":
      next.setMonth(next.getMonth() + 6);
      break;
    case "anual":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

export async function getTenantsData() {
  const [paquetes, tenants] = await Promise.all([
    prisma.paquete.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.tenant.findMany({
      take: 30,
      orderBy: { createAt: "desc" },
      include: {
        paquete: true,
        _count: { select: { usuarios: true, pacientes: true, roles: true } },
      },
    }),
  ]);

  return { paquetes, tenants };
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
      const tenant = await tx.tenant.create({
        data: {
          id: randomUUID(),
          nombre: data.nombre,
          slug: data.slug,
          plan: paquete.nombre,
          paqueteId: paquete.id,
          maxUsuarios: paquete.maxUsuarios,
          periodoPlan: data.periodoPlan,
          proximoPago: calculateNextPaymentDate(data.periodoPlan),
          contactoNombre: data.adminNombre,
          contactoCorreo: data.adminCorreo,
          activo: true,
        },
      });

      const tenantPermisos: { id: string; nombre: string }[] = [];
      for (const permission of TENANT_PERMISSIONS) {
        const created = await tx.permiso.create({
          data: {
            id: randomUUID(),
            tenantId: tenant.id,
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

    await prisma.tenant.update({
      where: { id: data.tenantId },
      data: {
        paqueteId: paquete.id,
        plan: paquete.nombre,
        maxUsuarios: paquete.maxUsuarios,
        periodoPlan: data.periodoPlan,
        proximoPago: calculateNextPaymentDate(data.periodoPlan),
      },
    });

    revalidatePath("/tenants");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo actualizar el plan" };
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
