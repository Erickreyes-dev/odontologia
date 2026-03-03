"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { tenantCreateSchema, TenantCreateInput } from "./schema";

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
        maxUsuarios: true,
        createAt: true,
        _count: {
          select: {
            usuarios: true,
            pacientes: true,
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
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const parsed = tenantCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const exists = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug } });
    if (exists) {
      return { success: false, error: "Ya existe un tenant con ese slug" };
    }

    await prisma.tenant.create({
      data: {
        id: randomUUID(),
        nombre: parsed.data.nombre,
        slug: parsed.data.slug,
        plan: parsed.data.plan,
        maxUsuarios: parsed.data.maxUsuarios,
        activo: true,
      },
    });

    revalidatePath("/dashboard-admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creando tenant",
    };
  }
}
