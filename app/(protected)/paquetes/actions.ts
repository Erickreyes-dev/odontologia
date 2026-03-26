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
