"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { Puesto, PuestoSchema } from './schema';

/**
 * Obtiene todos los puestos
 */
export async function getPuestos(): Promise<Puesto[]> {
  try {
    const records = await prisma.puesto.findMany();
    return records.map(r => ({
      id: r.Id,
      nombre: r.Nombre,
      descripcion: r.Descripcion,
      activo: r.Activo,
    }));
  } catch (error) {
    console.error("Error al obtener puestos:", error);
    return [];
  }
}

/**
 * Obtiene solo los puestos activos
 */
export async function getPuestosActivas(): Promise<Puesto[]> {
  try {
    const records = await prisma.puesto.findMany({ where: { Activo: true } });
    return records.map(r => ({
      id: r.Id,
      nombre: r.Nombre,
      descripcion: r.Descripcion,
      activo: r.Activo,
    }));
  } catch (error) {
    console.error("Error al obtener puestos activos:", error);
    return [];
  }
}


/**
 * Elimina un puesto por ID
 */
export async function deletePuesto(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID del puesto es requerido" };
    }

    await prisma.puesto.delete({
      where: { Id: id },
    });

    // Revalidar la página de puestos
    revalidatePath('/puestos');
    
    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar puesto con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al eliminar puesto" };
  }
}

/**
 * Obtiene un puesto por ID
 */
export async function getPuestoById(id: string): Promise<Puesto | null> {
  try {
    const r = await prisma.puesto.findUnique({ where: { Id: id } });
    if (!r) return null;
    return {
      id: r.Id,
      nombre: r.Nombre,
      descripcion: r.Descripcion,
      activo: r.Activo,
    };
  } catch (error) {
    console.error(`Error al obtener puesto con ID ${id}:`, error);
    return null;
  }
}

/**
 * Crea un nuevo puesto
 */
export async function createPuesto(data: Puesto): Promise<{ success: true; data: Puesto } | { success: false; error: string }> {
  try {
    // Validar datos con Zod
    const validatedData = PuestoSchema.parse({
      ...data,
      activo: data.activo ?? true,
    });

    const id = randomUUID();
    const r = await prisma.puesto.create({
      data: {
        Id: id,
        Nombre: validatedData.nombre,
        Descripcion: validatedData.descripcion,
        Activo: validatedData.activo,
      },
    });
    
    const result = {
      id: r.Id,
      nombre: r.Nombre,
      descripcion: r.Descripcion,
      activo: r.Activo,
    };

    // Revalidar la página de puestos
    revalidatePath('/puestos');
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al crear puesto:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al crear puesto" };
  }
}

/**
 * Actualiza un puesto existente
 */
export async function updatePuesto(id: string, data: Partial<Puesto>): Promise<{ success: true; data: Puesto } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID del puesto es requerido" };
    }

    // Validar datos con Zod (permitir campos parciales)
    const validatedData = PuestoSchema.partial().parse(data);

    const r = await prisma.puesto.update({
      where: { Id: id },
      data: {
        ...(validatedData.nombre && { Nombre: validatedData.nombre }),
        ...(validatedData.descripcion !== undefined && { Descripcion: validatedData.descripcion }),
        ...(validatedData.activo !== undefined && { Activo: validatedData.activo }),
      },
    });
    
    const result = {
      id: r.Id,
      nombre: r.Nombre,
      descripcion: r.Descripcion,
      activo: r.Activo,
    };

    // Revalidar la página de puestos
    revalidatePath('/puestos');
    revalidatePath(`/puestos/${id}/edit`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error al actualizar puesto con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al actualizar puesto" };
  }
}
