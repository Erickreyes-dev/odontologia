"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { PaqueteInput, paqueteSchema } from "./schema";

export async function getPaquetes() {
  return prisma.paquete.findMany({ orderBy: { createAt: "desc" } });
}

export async function createPaquete(
  input: PaqueteInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_paquetes")) {
      return { success: false, error: "No tiene permisos para gestionar paquetes" };
    }

    const parsed = paqueteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const nombre = data.nombre.trim();

    const exists = await prisma.paquete.findUnique({ where: { nombre } });
    if (exists) return { success: false, error: "Ya existe un paquete con ese nombre" };

    await prisma.paquete.create({
      data: {
        id: randomUUID(),
        nombre,
        descripcion: data.descripcion?.trim() || null,
        precio: data.precio,
        precioTrimestral: data.precioTrimestral ?? null,
        precioSemestral: data.precioSemestral ?? null,
        precioAnual: data.precioAnual ?? null,
        maxUsuarios: data.maxUsuarios,
        trialActivo: Boolean(data.trialActivo),
        trialDias: data.trialActivo ? (data.trialDias ?? 7) : 0,
        activo: true,
      },
    });

    revalidatePath("/paquetes");
    revalidatePath("/tenants");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo crear el paquete" };
  }
}

export async function updatePaquete(
  id: string,
  input: PaqueteInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_paquetes")) {
      return { success: false, error: "No tiene permisos para gestionar paquetes" };
    }

    const parsed = paqueteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const nombre = data.nombre.trim();

    const exists = await prisma.paquete.findFirst({ where: { nombre, NOT: { id } } });
    if (exists) return { success: false, error: "Ya existe otro paquete con ese nombre" };

    await prisma.paquete.update({
      where: { id },
      data: {
        nombre,
        descripcion: data.descripcion?.trim() || null,
        precio: data.precio,
        precioTrimestral: data.precioTrimestral ?? null,
        precioSemestral: data.precioSemestral ?? null,
        precioAnual: data.precioAnual ?? null,
        maxUsuarios: data.maxUsuarios,
        trialActivo: Boolean(data.trialActivo),
        trialDias: data.trialActivo ? (data.trialDias ?? 7) : 0,
      },
    });

    revalidatePath("/paquetes");
    revalidatePath("/tenants");
    revalidatePath("/registro-clinica");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo actualizar el paquete" };
  }
}

export async function seedRecommendedPaquetes(): Promise<{ success: true; created: number } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_paquetes")) {
      return { success: false, error: "No tiene permisos para gestionar paquetes" };
    }

    const recommended = [
      {
        nombre: "Starter",
        descripcion: "Ideal para consultorios pequeños que inician su digitalización.",
        maxUsuarios: 5,
        precio: 79,
        precioTrimestral: 219,
        precioSemestral: 414,
        precioAnual: 756,
        trialActivo: true,
        trialDias: 14,
      },
      {
        nombre: "Growth",
        descripcion: "Pensado para clínicas en crecimiento con más personal clínico y administrativo.",
        maxUsuarios: 15,
        precio: 149,
        precioTrimestral: 414,
        precioSemestral: 774,
        precioAnual: 1428,
        trialActivo: true,
        trialDias: 14,
      },
      {
        nombre: "Scale",
        descripcion: "Para clínicas de alto volumen que requieren operación multiusuario robusta.",
        maxUsuarios: 40,
        precio: 299,
        precioTrimestral: 834,
        precioSemestral: 1554,
        precioAnual: 2868,
        trialActivo: true,
        trialDias: 14,
      },
    ] satisfies PaqueteInput[];

    let created = 0;
    for (const pkg of recommended) {
      const exists = await prisma.paquete.findUnique({ where: { nombre: pkg.nombre } });
      if (exists) continue;
      await prisma.paquete.create({
        data: {
          id: randomUUID(),
          nombre: pkg.nombre,
          descripcion: pkg.descripcion ?? null,
          precio: pkg.precio,
          precioTrimestral: pkg.precioTrimestral ?? null,
          precioSemestral: pkg.precioSemestral ?? null,
          precioAnual: pkg.precioAnual ?? null,
          maxUsuarios: pkg.maxUsuarios,
          trialActivo: Boolean(pkg.trialActivo),
          trialDias: pkg.trialActivo ? (pkg.trialDias ?? 7) : 0,
          activo: true,
        },
      });
      created += 1;
    }

    revalidatePath("/paquetes");
    revalidatePath("/registro-clinica");
    return { success: true, created };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudieron generar los paquetes sugeridos" };
  }
}

export async function togglePaqueteStatus(
  id: string,
  activo: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.Permiso?.includes("gestionar_paquetes")) {
      return { success: false, error: "No tiene permisos para gestionar paquetes" };
    }

    await prisma.paquete.update({ where: { id }, data: { activo } });
    revalidatePath("/paquetes");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo actualizar el paquete" };
  }
}
