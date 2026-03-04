"use server";

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { Paciente, PacienteSchema } from './schema';
import { paginate } from '@/app/type';
import { Prisma } from '@/lib/generated/prisma';
import { tenantWhere, withTenantData } from '@/lib/tenant-query';
import { getSession } from '@/auth';

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


export async function createConstanciaMedica({
    pacienteId,
    motivo,
    diasReposo,
}: {
    pacienteId: string;
    motivo: string;
    diasReposo: number;
}): Promise<{
    success: boolean;
    error?: string;
    data?: {
        id: string;
        fechaGeneracion: Date;
        pacienteNombre: string;
        medicoNombre: string;
        motivo: string;
        diasReposo: number;
    };
}> {
    try {
        const session = await getSession();
        if (!session?.TenantId) {
            return { success: false, error: 'No hay una sesión activa.' };
        }

        if (!session.IdEmpleado) {
            return { success: false, error: 'El usuario activo no está asociado a un médico.' };
        }

        const motivoLimpio = motivo.trim();
        if (!motivoLimpio) {
            return { success: false, error: 'El motivo es requerido.' };
        }

        if (!Number.isInteger(diasReposo) || diasReposo < 1 || diasReposo > 365) {
            return { success: false, error: 'Los días de reposo deben estar entre 1 y 365.' };
        }

        const [paciente, medico] = await Promise.all([
            prisma.paciente.findFirst({
                where: await tenantWhere<Prisma.PacienteWhereInput>({ id: pacienteId }),
            }),
            prisma.medico.findFirst({
                where: {
                    tenantId: session.TenantId,
                    idEmpleado: session.IdEmpleado,
                    activo: true,
                },
                include: {
                    empleado: {
                        select: {
                            nombre: true,
                            apellido: true,
                        },
                    },
                },
            }),
        ]);

        if (!paciente) {
            return { success: false, error: 'Paciente no encontrado en este tenant.' };
        }

        if (!medico) {
            return { success: false, error: 'No se encontró un médico activo para esta sesión.' };
        }

        const constancia = await prisma.constanciaMedica.create({
            data: await withTenantData({
                id: randomUUID(),
                pacienteId: paciente.id,
                medicoId: medico.idEmpleado,
                motivo: motivoLimpio,
                diasReposo,
            }),
        });

        revalidatePath(`/pacientes/${pacienteId}/perfil`);

        return {
            success: true,
            data: {
                id: constancia.id,
                fechaGeneracion: constancia.fechaGeneracion,
                pacienteNombre: `${paciente.nombre} ${paciente.apellido}`.trim(),
                medicoNombre: `${medico.empleado.nombre} ${medico.empleado.apellido}`.trim(),
                motivo: constancia.motivo,
                diasReposo: constancia.diasReposo,
            },
        };
    } catch (error) {
        console.error('Error al crear constancia médica:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }

        return { success: false, error: 'Error desconocido al crear la constancia médica.' };
    }
}

export type ConstanciaMedicaResumen = {
    id: string;
    fechaGeneracion: Date;
    motivo: string;
    diasReposo: number;
    medicoNombre: string;
};

export async function getConstanciasMedicasByPaciente(pacienteId: string): Promise<ConstanciaMedicaResumen[]> {
    try {
        if (!pacienteId) return [];

        const records = await prisma.constanciaMedica.findMany({
            where: await tenantWhere<Prisma.ConstanciaMedicaWhereInput>({ pacienteId }),
            include: {
                medico: {
                    include: {
                        empleado: {
                            select: {
                                nombre: true,
                                apellido: true,
                            },
                        },
                    },
                },
            },
            orderBy: { fechaGeneracion: "desc" },
        });

        return records.map((record) => ({
            id: record.id,
            fechaGeneracion: record.fechaGeneracion,
            motivo: record.motivo,
            diasReposo: record.diasReposo,
            medicoNombre: `${record.medico?.empleado?.nombre ?? ""} ${record.medico?.empleado?.apellido ?? ""}`.trim() || "No especificado",
        }));
    } catch (error) {
        console.error("Error al obtener constancias médicas del paciente:", error);
        return [];
    }
}

export async function updateConstanciaMedica({
    constanciaId,
    motivo,
    diasReposo,
}: {
    constanciaId: string;
    motivo: string;
    diasReposo: number;
}): Promise<{
    success: boolean;
    error?: string;
    data?: {
        id: string;
        fechaGeneracion: Date;
        pacienteNombre: string;
        medicoNombre: string;
        motivo: string;
        diasReposo: number;
    };
}> {
    try {
        const motivoLimpio = motivo.trim();
        if (!motivoLimpio) {
            return { success: false, error: "El motivo es requerido." };
        }

        if (!Number.isInteger(diasReposo) || diasReposo < 1 || diasReposo > 365) {
            return { success: false, error: "Los días de reposo deben estar entre 1 y 365." };
        }

        const constancia = await prisma.constanciaMedica.findFirst({
            where: await tenantWhere<Prisma.ConstanciaMedicaWhereInput>({ id: constanciaId }),
            include: {
                paciente: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                    },
                },
                medico: {
                    include: {
                        empleado: {
                            select: {
                                nombre: true,
                                apellido: true,
                            },
                        },
                    },
                },
            },
        });

        if (!constancia) {
            return { success: false, error: "Constancia no encontrada." };
        }

        const updated = await prisma.constanciaMedica.update({
            where: { id: constancia.id },
            data: {
                motivo: motivoLimpio,
                diasReposo,
            },
        });

        revalidatePath(`/pacientes/${constancia.paciente.id}/perfil`);

        return {
            success: true,
            data: {
                id: updated.id,
                fechaGeneracion: updated.fechaGeneracion,
                pacienteNombre: `${constancia.paciente.nombre} ${constancia.paciente.apellido}`.trim(),
                medicoNombre: `${constancia.medico?.empleado?.nombre ?? ""} ${constancia.medico?.empleado?.apellido ?? ""}`.trim() || "No especificado",
                motivo: updated.motivo,
                diasReposo: updated.diasReposo,
            },
        };
    } catch (error) {
        console.error("Error al actualizar constancia médica:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }

        return { success: false, error: "Error desconocido al actualizar la constancia médica." };
    }
}
