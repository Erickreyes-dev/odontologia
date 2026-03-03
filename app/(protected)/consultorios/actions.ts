"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { Consultorio, ConsultorioSchema } from './schema';
import { Prisma } from '@/lib/generated/prisma';
import { tenantWhere, withTenantData } from '@/lib/tenant-query';

/**
 * Obtiene todos los consultorios
 */
export async function getConsultorios(): Promise<Consultorio[]> {
  try {
    const records = await prisma.consultorio.findMany({ where: await tenantWhere<Prisma.ConsultorioWhereInput>() });
    return records.map(r => ({
      id: r.id,
      nombre: r.nombre,
      ubicacion: r.ubicacion || "Sin ubicación",
      activo: r.activo,
    }));
  } catch (error) {
    console.error("Error al obtener los consultorios:", error);
    return [];
  }
}

/**
 * Obtiene solo los consultorios activos
 */
export async function getConsultoriosActios(): Promise<Consultorio[]> {
  try {
    const records = await prisma.consultorio.findMany({ where: await tenantWhere<Prisma.ConsultorioWhereInput>({ activo: true }) });
    return records.map(r => ({
      id: r.id,
      nombre: r.nombre,
      ubicacion: r.ubicacion || "Sin ubicación",
      activo: r.activo,
    }));
  } catch (error) {
    console.error("Error al obtener consultorios activos:", error);
    return [];
  }
}


/**
 * Elimina un consultorio por ID
 */
export async function deleteConsultorio(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID del consultorio es requerido" };
    }

    await prisma.consultorio.deleteMany({
      where: await tenantWhere<Prisma.ConsultorioWhereInput>({ id }),
    });

    // Revalidar la página de consultorio
    revalidatePath('/consultorios');
    
    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar consultorio con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al eliminar consultorio" };
  }
}

/**
 * Obtiene un consultorio por ID
 */
export async function getConsultorioById(id: string): Promise<Consultorio | null> {
  try {
    const r = await prisma.consultorio.findFirst({ where: await tenantWhere<Prisma.ConsultorioWhereInput>({ id }) });
    if (!r) return null;
    return {
      id: r.id,
      nombre: r.nombre,
      ubicacion: r.ubicacion || "Sin ubicación",
      activo: r.activo,
    };
  } catch (error) {
    console.error(`Error al obtener consultorio con ID ${id}:`, error);
    return null;
  }
}

/**
 * Crea un nuevo consultorio
 */
export async function createConsultorio(data: Consultorio): Promise<{ success: true; data: Consultorio } | { success: false; error: string }> {
  try {
    // Validar datos con Zod
    const validatedData = ConsultorioSchema.parse({
      ...data,
      activo: data.activo ?? true,
    });

    const id = randomUUID();
    const r = await prisma.consultorio.create({
      data: await withTenantData({
        id: id,
        nombre: validatedData.nombre,
        ubicacion: validatedData.ubicacion,
        activo: validatedData.activo,
      }),
    });
    
    const result = {
      id: r.id,
      nombre: r.nombre,
      ubicacion: r.ubicacion || "Sin ubicación",
      activo: r.activo,
    };

    // Revalidar la página de consultorio
    revalidatePath('/consultorios');
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al crear consultorio:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al crear consultorio" };
  }
}

/**
 * Actualiza un consultorio existente
 */
export async function updateConsultorio(id: string, data: Partial<Consultorio>): Promise<{ success: true; data: Consultorio } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID del consultorio es requerido" };
    }

    // Validar datos con Zod (permitir campos parciales)
    const validatedData = ConsultorioSchema.partial().parse(data);

    const existing = await prisma.consultorio.findFirst({ where: await tenantWhere<Prisma.ConsultorioWhereInput>({ id }) });
    if (!existing) {
      return { success: false, error: "Registro no encontrado en la clínica" };
    }

    const r = await prisma.consultorio.update({
      where: { id: existing.id },
      data: {
        ...(validatedData.nombre && { nombre: validatedData.nombre }),
        ...(validatedData.ubicacion !== undefined && { ubicacion: validatedData.ubicacion }),
        ...(validatedData.activo !== undefined && { activo: validatedData.activo }),
      },
    });
    
    const result = {
      id: r.id,
      nombre: r.nombre,
      ubicacion: r.ubicacion || "Sin ubicación",
      activo: r.activo,
    };

    // Revalidar la página de consultorio
    revalidatePath('/consultorios');
    revalidatePath(`/consultorios/${id}/edit`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error al actualizar consultorio con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al actualizar consultorio" };
  }
}
