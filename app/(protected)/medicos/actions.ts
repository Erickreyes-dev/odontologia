"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Medico, MedicoSchema } from "./schema";

/**
 * Obtiene todos los médicos
 */
export async function getMedicos(): Promise<Medico[]> {
  try {
    const records = await prisma.medico.findMany({
      include: {
        empleado: true,  // Lo incluimos solo para tener la referencia
        profesion: true,
      },
    });

    return records.map(r => ({
      idEmpleado: r.idEmpleado,
      profesionId: r.profesionId,
      activo: r.activo,
      createAt: r.createAt,
      updateAt: r.updateAt,
      // Solo incluyo los campos mínimos de empleado y profesion
      empleado: r.empleado
        ? {
          id: r.empleado.id,
          nombre: r.empleado.nombre,
          apellido: r.empleado.apellido,
          activo: r.empleado.activo,
        }
        : undefined,
      profesion: r.profesion
        ? {
          id: r.profesion.id,
          nombre: r.profesion.nombre,
          descripcion: r.profesion.descripcion ?? "",
          activo: r.profesion.activo,
        }
        : undefined,
    }));
  } catch (error) {
    console.error("Error al obtener los médicos:", error);
    return [];
  }
}

/**
 * Obtiene solo los médicos activos
 */
export async function getMedicosActivos(): Promise<Medico[]> {
  try {
    const records = await prisma.medico.findMany({
      where: { activo: true },
      include: { empleado: true, profesion: true },
    });
    return records.map(r => ({
      idEmpleado: r.idEmpleado,
      profesionId: r.profesionId,
      activo: r.activo,
      createAt: r.createAt,
      updateAt: r.updateAt,
      // Solo incluyo los campos mínimos de empleado y profesion
      empleado: r.empleado
        ? {
          id: r.empleado.id,
          nombre: r.empleado.nombre,
          apellido: r.empleado.apellido,
          activo: r.empleado.activo,
        }
        : undefined,
      profesion: r.profesion
        ? {
          id: r.profesion.id,
          nombre: r.profesion.nombre,
          descripcion: r.profesion.descripcion ?? "",
          activo: r.profesion.activo,
        }
        : undefined,
    }));
  } catch (error) {
    console.error("Error al obtener médicos activos:", error);
    return [];
  }
}

/**
 * Obtiene un médico por IDEmpleado
 */
export async function getMedicoById(idEmpleado: string): Promise<Medico | null> {
  try {
    const r = await prisma.medico.findUnique({
      where: { idEmpleado },
      include: { empleado: true, profesion: true },
    });
    if (!r) return null;
    return {
      idEmpleado: r.idEmpleado,
      profesionId: r.profesionId,
      activo: r.activo,
      createAt: r.createAt,
      updateAt: r.updateAt,
    };
  } catch (error) {
    console.error(`Error al obtener médico con IDEmpleado ${idEmpleado}:`, error);
    return null;
  }
}

/**
 * Crea un nuevo médico
 */
export async function createMedico(data: Medico): Promise<{ success: true; data: Medico } | { success: false; error: string }> {
  try {
    const validatedData = MedicoSchema.parse({
      ...data,
      activo: data.activo ?? true,
    });

    const r = await prisma.medico.create({
      data: {
        idEmpleado: validatedData.idEmpleado,
        profesionId: validatedData.profesionId,
        activo: validatedData.activo,
      },
    });

    const result = {
      idEmpleado: r.idEmpleado,
      profesionId: r.profesionId,
      activo: r.activo,
      createAt: r.createAt,
      updateAt: r.updateAt,
    };

    revalidatePath("/medicos");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al crear médico:", error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: "Error desconocido al crear médico" };
  }
}

/**
 * Actualiza un médico existente
 */
export async function updateMedico(
  idEmpleado: string,
  data: Partial<Medico>
): Promise<{ success: true; data: Medico } | { success: false; error: string }> {
  try {
    if (!idEmpleado) return { success: false, error: "ID del empleado es requerido" };

    const validatedData = MedicoSchema.partial().parse(data);

    const r = await prisma.medico.update({
      where: { idEmpleado },
      data: {
        ...(validatedData.profesionId && { profesionId: validatedData.profesionId }),
        ...(validatedData.activo !== undefined && { activo: validatedData.activo }),
      },
    });

    const result = {
      idEmpleado: r.idEmpleado,
      profesionId: r.profesionId,
      activo: r.activo,
      createAt: r.createAt,
      updateAt: r.updateAt,
    };

    revalidatePath("/medicos");
    revalidatePath(`/medicos/${idEmpleado}/edit`);

    return { success: true, data: result };
  } catch (error) {
    console.error(`Error al actualizar médico con IDEmpleado ${idEmpleado}:`, error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: "Error desconocido al actualizar médico" };
  }
}

/**
 * Elimina un médico por IDEmpleado
 */
export async function deleteMedico(
  idEmpleado: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!idEmpleado) return { success: false, error: "ID del empleado es requerido" };

    await prisma.medico.delete({
      where: { idEmpleado },
    });

    revalidatePath("/medicos");

    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar médico con IDEmpleado ${idEmpleado}:`, error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: "Error desconocido al eliminar médico" };
  }
}
