"use server";

import { deleteTenantFileFromS3 } from "@/lib/s3";
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { Paciente, PacienteSchema } from './schema';
import { paginate } from '@/app/type';
import { Prisma } from '@/lib/generated/prisma';
import { tenantWhere, withTenantData } from '@/lib/tenant-query';
import { getSession } from '@/auth';
import { getTenantContext } from '@/lib/tenant';

function normalizeOptionalEmail(value?: string | null): string | null {
    if (value == null) return null;
    const normalized = value.trim();
    return normalized === "" ? null : normalized;
}

function normalizeOptionalId(value?: string | null): string | null {
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
      conocioClinica: r.conocioClinica,
      conocioClinicaCatalogoId: r.conocioClinicaCatalogoId,
      decisionAgendarCatalogoId: r.decisionAgendarCatalogoId,
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
            conocioClinica: r.conocioClinica,
            conocioClinicaCatalogoId: r.conocioClinicaCatalogoId,
            decisionAgendarCatalogoId: r.decisionAgendarCatalogoId,
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
            conocioClinica: r.conocioClinica,
            conocioClinicaCatalogoId: r.conocioClinicaCatalogoId,
            decisionAgendarCatalogoId: r.decisionAgendarCatalogoId,
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
                seguroId: normalizeOptionalId(validatedData.seguroId),
                conocioClinica: validatedData.conocioClinica ?? null,
                conocioClinicaCatalogoId: normalizeOptionalId(validatedData.conocioClinicaCatalogoId),
                decisionAgendarCatalogoId: normalizeOptionalId(validatedData.decisionAgendarCatalogoId),
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
            conocioClinica: r.conocioClinica,
            conocioClinicaCatalogoId: r.conocioClinicaCatalogoId,
            decisionAgendarCatalogoId: r.decisionAgendarCatalogoId,
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
                ...(validatedData.seguroId !== undefined && { seguroId: normalizeOptionalId(validatedData.seguroId) }),
                ...(validatedData.conocioClinica !== undefined && { conocioClinica: validatedData.conocioClinica }),
                ...(validatedData.conocioClinicaCatalogoId !== undefined && { conocioClinicaCatalogoId: normalizeOptionalId(validatedData.conocioClinicaCatalogoId) }),
                ...(validatedData.decisionAgendarCatalogoId !== undefined && { decisionAgendarCatalogoId: normalizeOptionalId(validatedData.decisionAgendarCatalogoId) }),
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
            conocioClinica: r.conocioClinica,
            conocioClinicaCatalogoId: r.conocioClinicaCatalogoId,
            decisionAgendarCatalogoId: r.decisionAgendarCatalogoId,
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

        const constancia = await (prisma as any).constanciaMedica.create({
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

        const records = await (prisma as any).constanciaMedica.findMany({
            where: await tenantWhere<any>({ pacienteId }),
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

        return records.map((record: any) => ({
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

        const constancia = await (prisma as any).constanciaMedica.findFirst({
            where: await tenantWhere<any>({ id: constanciaId }),
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

        const updated = await (prisma as any).constanciaMedica.update({
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

export type ExpedienteClinicoPaciente = {
    id?: string;
    pacienteId: string;
    tiempoEnfermedad?: string | null;
    signosSintomasPrincipales?: string | null;
    relatoCronologico?: string | null;
    funcionesBiologicas?: string | null;
    antecedentesFamiliares?: string | null;
    antecedentesPersonales?: string | null;
    presionAlta?: boolean | null;
    presionBaja?: boolean | null;
    hepatitis?: boolean | null;
    gastritis?: boolean | null;
    vih?: boolean | null;
    diabetes?: boolean | null;
    asma?: boolean | null;
    fuma?: boolean | null;
    comentarioAdicional?: string | null;
    enfermedadesSanguineas?: boolean | null;
    enfermedadesSanguineasCuales?: string | null;
    problemasCardiacos?: boolean | null;
    problemasCardiacosCuales?: string | null;
    otraEnfermedad?: string | null;
    cepilladoDentalFrecuencia?: string | null;
    sangranEncias?: boolean | null;
    hemorragiasExtraccion?: boolean | null;
    bruxismo?: boolean | null;
    otraMolestiaBoca?: string | null;
    alergias?: string | null;
    operacionGrandeReciente?: string | null;
    medicacionPermanente?: string | null;
    presionArterial?: string | null;
    frecuenciaCardiaca?: string | null;
    temperatura?: string | null;
    frecuenciaRespiratoria?: string | null;
    examenExtraoral?: string | null;
    examenIntraoral?: string | null;
};

const expedienteTextFields = [
    'tiempoEnfermedad', 'signosSintomasPrincipales', 'relatoCronologico', 'funcionesBiologicas',
    'antecedentesFamiliares', 'antecedentesPersonales', 'comentarioAdicional', 'enfermedadesSanguineasCuales',
    'problemasCardiacosCuales', 'otraEnfermedad', 'cepilladoDentalFrecuencia', 'otraMolestiaBoca', 'alergias',
    'operacionGrandeReciente', 'medicacionPermanente', 'presionArterial', 'frecuenciaCardiaca', 'temperatura',
    'frecuenciaRespiratoria', 'examenExtraoral', 'examenIntraoral',
] as const;

const expedienteBooleanFields = [
    'presionAlta', 'presionBaja', 'hepatitis', 'gastritis', 'vih', 'diabetes', 'asma', 'fuma',
    'enfermedadesSanguineas', 'problemasCardiacos', 'sangranEncias', 'hemorragiasExtraccion', 'bruxismo',
] as const;

function optionalText(formData: FormData, key: string) {
    const value = formData.get(key)?.toString().trim() ?? '';
    return value ? value : null;
}

function optionalBoolean(formData: FormData, key: string) {
    const value = formData.get(key)?.toString();
    if (value === 'si') return true;
    if (value === 'no') return false;
    return null;
}

export async function getExpedienteClinicoByPaciente(pacienteId: string): Promise<ExpedienteClinicoPaciente | null> {
    try {
        const expediente = await prisma.expedienteClinicoPaciente.findFirst({
            where: await tenantWhere<Prisma.ExpedienteClinicoPacienteWhereInput>({ pacienteId }),
        });

        return expediente;
    } catch (error) {
        console.error('Error al obtener expediente clínico del paciente:', error);
        return null;
    }
}

export async function saveExpedienteClinicoPaciente(pacienteId: string, formData: FormData) {
    const paciente = await prisma.paciente.findFirst({
        where: await tenantWhere<Prisma.PacienteWhereInput>({ id: pacienteId }),
        select: { id: true },
    });

    if (!paciente) {
        throw new Error('Paciente no encontrado en este tenant.');
    }

    const data: Record<string, string | boolean | null> = {};
    for (const field of expedienteTextFields) data[field] = optionalText(formData, field);
    for (const field of expedienteBooleanFields) data[field] = optionalBoolean(formData, field);

    await prisma.expedienteClinicoPaciente.upsert({
        where: { pacienteId: paciente.id },
        create: await withTenantData({
            id: randomUUID(),
            pacienteId: paciente.id,
            ...data,
        }),
        update: data,
    });

    revalidatePath(`/pacientes/${pacienteId}/perfil`);
    revalidatePath(`/pacientes/${pacienteId}/expediente-clinico`);
}

export async function getArchivosPaciente(pacienteId: string) {
  return prisma.pacienteArchivo.findMany({
    where: await tenantWhere<Prisma.PacienteArchivoWhereInput>({ pacienteId }),
    orderBy: { createAt: "desc" },
  });
}

export async function registrarArchivoPaciente(input: { ownerId: string; nombre: string; key: string; mimeType?: string; size?: number }) {
  try {
    const { tenantId } = await getTenantContext();
    const paciente = await prisma.paciente.findFirst({ where: await tenantWhere<Prisma.PacienteWhereInput>({ id: input.ownerId }), select: { id: true } });
    if (!paciente) return { success: false as const, error: "Paciente no encontrado" };
    const archivo = await prisma.pacienteArchivo.create({ data: { id: randomUUID(), tenantId, pacienteId: paciente.id, nombre: input.nombre, key: input.key, mimeType: input.mimeType || null, size: input.size ?? null } });
    revalidatePath(`/pacientes/${paciente.id}/perfil`);
    return { success: true as const, archivo };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "No se pudo registrar el archivo" };
  }
}

export async function eliminarArchivoPaciente(id: string) {
  try {
    const archivo = await prisma.pacienteArchivo.findFirst({ where: await tenantWhere<Prisma.PacienteArchivoWhereInput>({ id }) });
    if (!archivo) return { success: false as const, error: "Archivo no encontrado" };
    await deleteTenantFileFromS3(archivo.key);
    await prisma.pacienteArchivo.delete({ where: { id: archivo.id } });
    revalidatePath(`/pacientes/${archivo.pacienteId}/perfil`);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "No se pudo eliminar el archivo" };
  }
}


export async function getCatalogosPaciente() {
    const [conocioClinica, decisionAgendar] = await Promise.all([
        prisma.catalogoConocioClinica.findMany({ where: await tenantWhere<Prisma.CatalogoConocioClinicaWhereInput>({ activo: true }), orderBy: { nombre: "asc" } }),
        prisma.catalogoDecisionPaciente.findMany({ where: await tenantWhere<Prisma.CatalogoDecisionPacienteWhereInput>({ activo: true }), orderBy: { nombre: "asc" } }),
    ]);

    return {
        conocioClinica: conocioClinica.map((item) => ({ id: item.id, nombre: item.nombre })),
        decisionAgendar: decisionAgendar.map((item) => ({ id: item.id, nombre: item.nombre })),
    };
}

export async function createCatalogoConocioClinica(nombre: string) {
    const value = nombre.trim();
    if (!value) return { ok: false, message: "Debe escribir una opción." };
    await prisma.catalogoConocioClinica.create({ data: await withTenantData({ id: randomUUID(), nombre: value, activo: true }) });
    revalidatePath('/mantenimiento/catalogos');
    revalidatePath('/pacientes/create');
    return { ok: true };
}

export async function createCatalogoDecisionPaciente(nombre: string) {
    const value = nombre.trim();
    if (!value) return { ok: false, message: "Debe escribir una opción." };
    await prisma.catalogoDecisionPaciente.create({ data: await withTenantData({ id: randomUUID(), nombre: value, activo: true }) });
    revalidatePath('/mantenimiento/catalogos');
    revalidatePath('/pacientes/create');
    return { ok: true };
}
