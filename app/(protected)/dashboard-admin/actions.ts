"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { tenantCreateSchema, TenantCreateInput } from "./schema";
import { PLATFORM_PERMISSIONS, TENANT_PERMISSIONS } from "@/lib/permission-catalog";
import bcrypt from "bcryptjs";
import { getSession } from "@/auth";
import { buildTenantLoginUrl } from "@/lib/tenant-url";


async function ensurePlatformPermissions(tenantId: string) {
  const role = await prisma.rol.findFirst({
    where: { tenantId, nombre: "OwnerPlatform", activo: true },
  });

  if (!role) return;

  for (const permission of PLATFORM_PERMISSIONS) {
    const permiso = await prisma.permiso.upsert({
      where: { nombre: permission.nombre },
      update: { descripcion: permission.descripcion, activo: true },
      create: {
        id: randomUUID(),
        nombre: permission.nombre,
        descripcion: permission.descripcion,
        activo: true,
      },
    });

    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: role.id, permisoId: permiso.id } },
      update: {},
      create: { id: randomUUID(), rolId: role.id, permisoId: permiso.id },
    });
  }
}
export async function getAdminDashboardData() {
  const session = await getSession();
  if (session?.TenantId) await ensurePlatformPermissions(session.TenantId);
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
): Promise<{ success: true; adminPassword: string; loginUrl: string } | { success: false; error: string }> {
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

      const tenantPermisos: { id: string; nombre: string }[] = [];
      for (const permission of TENANT_PERMISSIONS) {
        const created = await tx.permiso.upsert({
          where: { nombre: permission.nombre },
          update: { descripcion: permission.descripcion, activo: true },
          create: {
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

      const profilePermission = tenantPermisos.find((p) => p.nombre === "ver_profile");
      if (!profilePermission) {
        throw new Error("No se pudo asignar permiso de perfil al administrador del tenant");
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
    return { success: true, adminPassword, loginUrl: buildTenantLoginUrl(data.slug) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creando tenant",
    };
  }
}

export async function toggleTenantStatus(
  tenantId: string,
  activo: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_tenants")) {
      return { success: false, error: "No tiene permisos para gestionar tenants" };
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { activo },
    });

    revalidatePath("/dashboard-admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo actualizar el tenant",
    };
  }
}

export async function createPlatformAdminUser(input: {
  usuario: string;
  password?: string;
}): Promise<{ success: true; generatedPassword: string } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_tenants") || !session?.TenantId) {
      return { success: false, error: "No tiene permisos para crear administradores globales" };
    }

    const usuario = input.usuario?.trim().toLowerCase();
    if (!usuario || usuario.length < 4) {
      return { success: false, error: "El usuario debe tener al menos 4 caracteres" };
    }

    const generatedPassword = input.password?.trim().length
      ? input.password
      : randomBytes(9).toString("base64").slice(0, 12);

    await ensurePlatformPermissions(session.TenantId);

    const role = await prisma.rol.findFirst({
      where: { tenantId: session.TenantId, nombre: "OwnerPlatform", activo: true },
    });

    if (!role) {
      return { success: false, error: "No se encontró el rol OwnerPlatform" };
    }

    const existing = await prisma.usuarios.findFirst({
      where: { tenantId: session.TenantId, usuario },
    });

    if (existing) {
      return { success: false, error: "Ya existe un usuario global con ese nombre" };
    }

    await prisma.usuarios.create({
      data: {
        id: randomUUID(),
        tenantId: session.TenantId,
        usuario,
        contrasena: await bcrypt.hash(generatedPassword, 10),
        empleado_id: null,
        rol_id: role.id,
        activo: true,
        DebeCambiarPassword: true,
      },
    });

    revalidatePath("/dashboard-admin");
    return { success: true, generatedPassword };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo crear administrador global",
    };
  }
}
