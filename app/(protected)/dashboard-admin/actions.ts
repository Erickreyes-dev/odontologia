"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { tenantCreateSchema, TenantCreateInput } from "./schema";
import { TENANT_PERMISSIONS } from "@/lib/permission-catalog";
import bcrypt from "bcryptjs";

export async function getAdminDashboardData() {
  const [
    totalTenants,
    activeTenants,
    inactiveTenants,
    totalUsers,
    totalPacientes,
    recentTenants,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { activo: true } }),
    prisma.tenant.count({ where: { activo: false } }),
    prisma.usuarios.count(),
    prisma.paciente.count(),
    prisma.tenant.findMany({
      take: 8,
      orderBy: { createAt: "desc" },
      select: {
        id: true,
        nombre: true,
        slug: true,
        plan: true,
        activo: true,
        contactoNombre: true,
        contactoCorreo: true,
        maxUsuarios: true,
        createAt: true,
        _count: {
          select: {
            usuarios: true,
            pacientes: true,
            roles: true,
          },
        },
      },
    }),
  ]);

  return {
    kpis: {
      totalTenants,
      activeTenants,
      inactiveTenants,
      totalUsers,
      totalPacientes,
    },
    recentTenants,
  };
}

export async function createTenant(
  input: TenantCreateInput
): Promise<{ success: true; adminPassword: string } | { success: false; error: string }> {
  try {
    const parsed = tenantCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
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
          plan: data.plan,
          maxUsuarios: data.maxUsuarios,
          contactoNombre: data.adminNombre,
          contactoCorreo: data.adminCorreo,
          activo: true,
        },
      });

      const tenantPermisos: { id: string }[] = [];
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
        tenantPermisos.push({ id: created.id });
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
      if (adminExists) {
        throw new Error("El usuario admin del tenant ya existe");
      }

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

    revalidatePath("/dashboard-admin");
    return { success: true, adminPassword };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creando tenant",
    };
  }
}
