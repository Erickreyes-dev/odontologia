"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { Seguro, SeguroSchema } from './schema';

/**
 * Obtiene todos los puestos
 */
export async function getSeguros(): Promise<Seguro[]> {
  try {
    const records = await prisma.seguro.findMany();
    return records.map(r => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion || "Sin descripción",
      activo: r.activo,
    }));
  } catch (error) {
    console.error("Error al obtener los seguros:", error);
    return [];
  }
}

/**
 * Obtiene solo los seguros activos
 */
export async function getSegurosActivos(): Promise<Seguro[]> {
  try {
    const records = await prisma.seguro.findMany({ where: { activo: true } });
    return records.map(r => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion || "Sin descripción",
      activo: r.activo,
    }));
  } catch (error) {
    console.error("Error al obtener seguros activos:", error);
    return [];
  }
}


/**
 * Elimina un puesto por ID
 */
export async function deleteSeguro(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID del seguro es requerido" };
    }

    await prisma.seguro.delete({
      where: { id },
    });

    // Revalidar la página de seguros
    revalidatePath('/seguros');
    
    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar seguro con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al eliminar seguro" };
  }
}

/**
 * Obtiene un puesto por ID
 */
export async function getSeguroById(id: string): Promise<Seguro | null> {
  try {
    const r = await prisma.seguro.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion || "Sin descripción",
      activo: r.activo,
    };
  } catch (error) {
    console.error(`Error al obtener seguro con ID ${id}:`, error);
    return null;
  }
}

/**
 * Crea un nuevo puesto
 */
export async function createSeguro(data: Seguro): Promise<{ success: true; data: Seguro } | { success: false; error: string }> {
  try {
    // Validar datos con Zod
    const validatedData = SeguroSchema.parse({
      ...data,
      activo: data.activo ?? true,
    });

    const id = randomUUID();
    const r = await prisma.seguro.create({
      data: {
        id: id,
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion,
        activo: validatedData.activo,
      },
    });
    
    const result = {
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion || "Sin descripción",
      activo: r.activo,
    };

    // Revalidar la página de seguro
    revalidatePath('/seguros');
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al crear seguro:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al crear seguro" };
  }
}

/**
 * Actualiza un puesto existente
 */
export async function updateSeguro(id: string, data: Partial<Seguro>): Promise<{ success: true; data: Seguro } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID del seguro es requerido" };
    }

    // Validar datos con Zod (permitir campos parciales)
    const validatedData = SeguroSchema.partial().parse(data);

    const r = await prisma.seguro.update({
      where: { id },
      data: {
        ...(validatedData.nombre && { nombre: validatedData.nombre }),
        ...(validatedData.descripcion !== undefined && { descripcion: validatedData.descripcion }),
        ...(validatedData.activo !== undefined && { activo: validatedData.activo }),
      },
    });
    
    const result = {
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion || "Sin descripción",
      activo: r.activo,
    };

    // Revalidar la página de seguro
    revalidatePath('/seguros');
    revalidatePath(`/seguros/${id}/edit`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error al actualizar seguro con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al actualizar seguro" };
  }
}
