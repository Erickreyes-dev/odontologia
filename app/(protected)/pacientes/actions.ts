"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { Paciente, PacienteSchema } from './schema';
import { paginate } from '@/app/type';
import { Prisma } from '@/lib/generated/prisma';
import { tenantWhere, withTenantData } from '@/lib/tenant-query';

function normalizeOptionalEmail(value?: string | null): string | null {
    if (value == null) return null;
    const normalized = value.trim();
    return normalized === "" ? null : normalized;
}

/**
 * Obtiene todos los pacientes
 */
export async function getPacientes({
  page = 1,
  pageSize = 10,
}: {
  page?: number;
  pageSize?: number;
}) {
  try {
    const result = await paginate<Paciente, Prisma.PacienteWhereInput>({
      model: prisma.paciente,
      page,
      pageSize,
      where: await tenantWhere<Prisma.PacienteWhereInput>(),
      orderBy: { nombre: "asc" },
    });

    // Mapeo igual al que ya tenías antes
    const pacientes: Paciente[] = result.data.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      apellido: r.apellido,
      identidad: r.identidad,
      fechaNacimiento: r.fechaNacimiento
        ? new Date(r.fechaNacimiento)
        : null,
      genero: r.genero,
      telefono: r.telefono,
      correo: r.correo,
      direccion: r.direccion,
      seguroId: r.seguroId || "",
      activo: r.activo,
    }));

    return {
      data: pacientes,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.pageCount,
    };
  } catch (error) {
    console.error("Error al obtener los pacientes:", error);
    return {
      data: [] as Paciente[],
      total: 0,
      page,
      pageSize,
      pageCount: 0, // 👈 aquí también usamos pageCount
    };
  }
}

/**
 * Obtiene solo los pacientes activos
 */
export async function getPacientesActivos(): Promise<Paciente[]> {
    try {
        const records = await prisma.paciente.findMany({ where: await tenantWhere<Prisma.PacienteWhereInput>({ activo: true }) });
        return records.map(r => ({
            id: r.id,
            nombre: r.nombre,
            apellido: r.apellido,
            identidad: r.identidad,
            fechaNacimiento: r.fechaNacimiento ? new Date(r.fechaNacimiento) : null, // Date real
            genero: r.genero,
            telefono: r.telefono,
            correo: r.correo,
            direccion: r.direccion,
            seguroId: r.seguroId || "",
            activo: r.activo,
        }));
    } catch (error) {
        console.error("Error al obtener pacientes activos:", error);
        return [];
    }
}


/**
 * Elimina un puesto por ID
 */
export async function deletePaciente(id: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
        if (!id) {
            return { success: false, error: "ID del paciente es requerido" };
        }

        await prisma.paciente.deleteMany({
            where: await tenantWhere<Prisma.PacienteWhereInput>({ id }),
        });

        // Revalidar la página de paciente
        revalidatePath('/pacientes');

        return { success: true };
    } catch (error) {
        console.error(`Error al eliminar paciente con ID ${id}:`, error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Error desconocido al eliminar paciente" };
    }
}

/**
 * Obtiene un paciente por ID
 */
export async function getPacienteById(id: string): Promise<Paciente | null> {
    try {
        const r = await prisma.paciente.findFirst({ where: await tenantWhere<Prisma.PacienteWhereInput>({ id }) });
        if (!r) return null;
        return {
            id: r.id,
            nombre: r.nombre,
            apellido: r.apellido,
            identidad: r.identidad,
            fechaNacimiento: r.fechaNacimiento ? new Date(r.fechaNacimiento) : null, // Date real
            genero: r.genero,
            telefono: r.telefono,
            correo: r.correo,
            direccion: r.direccion,
            seguroId: r.seguroId || "",
            activo: r.activo,
        };
    } catch (error) {
        console.error(`Error al obtener paciente con ID ${id}:`, error);
        return null;
    }
}

/**
 * Crea un nuevo puesto
 */
export async function createPaciente(data: Paciente): Promise<{ success: true; data: Paciente } | { success: false; error: string }> {
    try {
        // Validar datos con Zod
        const validatedData = PacienteSchema.parse({
            ...data,
            activo: data.activo ?? true,
            seguroId: data.seguroId || undefined,

        });

        
        const id = randomUUID();
        const r = await prisma.paciente.create({
            data: await withTenantData({
                id: id,
                nombre: validatedData.nombre,
                apellido: validatedData.apellido,
                identidad: validatedData.identidad,
                fechaNacimiento: validatedData.fechaNacimiento ? new Date(validatedData.fechaNacimiento) : null,
                genero: validatedData.genero,
                telefono: validatedData.telefono,
                correo: normalizeOptionalEmail(validatedData.correo),
                direccion: validatedData.direccion,
                seguroId: validatedData.seguroId,
                activo: validatedData.activo,
            }),
        });

        const result = {
            id: r.id,
            nombre: r.nombre,
            apellido: r.apellido,
            identidad: r.identidad,
            fechaNacimiento: r.fechaNacimiento ? new Date(r.fechaNacimiento) : null, // Date real
            genero: r.genero,
            telefono: r.telefono,
            correo: r.correo,
            direccion: r.direccion,
            seguroId: r.seguroId || "",
            activo: r.activo,
        };

        // Revalidar la página de paciente
        revalidatePath('/pacientes');

        return { success: true, data: result };
    } catch (error) {
        console.error("Error al crear paciente:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Error desconocido al crear paciente" };
    }
}

/**
 * Actualiza un puesto existente
 */
export async function updatePaciente(id: string, data: Partial<Paciente>): Promise<{ success: true; data: Paciente } | { success: false; error: string }> {
    try {
        if (!id) {
            return { success: false, error: "ID del paciente es requerido" };
        }

        // Validar datos con Zod (permitir campos parciales)
        const validatedData = PacienteSchema.partial().parse(data);

        const existing = await prisma.paciente.findFirst({ where: await tenantWhere<Prisma.PacienteWhereInput>({ id }) });
        if (!existing) {
            return { success: false, error: "Paciente no encontrado en la clínica" };
        }

        const r = await prisma.paciente.update({
            where: { id: existing.id },
            data: {
                ...(validatedData.nombre && { nombre: validatedData.nombre }),
                ...(validatedData.apellido && { apellido: validatedData.apellido }),
                ...(validatedData.identidad && { identidad: validatedData.identidad }),
                ...(validatedData.fechaNacimiento !== undefined && { fechaNacimiento: validatedData.fechaNacimiento ? new Date(validatedData.fechaNacimiento) : null }),
                ...(validatedData.genero !== undefined && { genero: validatedData.genero }),
                ...(validatedData.telefono !== undefined && { telefono: validatedData.telefono }),
                ...(validatedData.correo !== undefined && { correo: normalizeOptionalEmail(validatedData.correo) }),
                ...(validatedData.direccion !== undefined && { direccion: validatedData.direccion }),
                ...(validatedData.seguroId !== undefined && { seguroId: validatedData.seguroId }),
                ...(validatedData.activo !== undefined && { activo: validatedData.activo }),
            },
        });

        const result = {
            id: r.id,
            nombre: r.nombre,
            apellido: r.apellido,
            identidad: r.identidad,
            fechaNacimiento: r.fechaNacimiento ? new Date(r.fechaNacimiento) : null, // Date real
            genero: r.genero,
            telefono: r.telefono,
            correo: r.correo,
            direccion: r.direccion,
            seguroId: r.seguroId || "",
            activo: r.activo,
        };

        // Revalidar la página de paciente
        revalidatePath('/pacientes');
        revalidatePath(`/pacientes/${id}/edit`);

        return { success: true, data: result };
    } catch (error) {
        console.error(`Error al actualizar paciente con ID ${id}:`, error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Error desconocido al actualizar paciente" };
    }
}
