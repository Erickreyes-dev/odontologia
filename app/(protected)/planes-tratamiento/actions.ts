"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
  PlanTratamiento,
  PlanTratamientoSchema,
  PlanEtapa,
  Seguimiento,
} from "./schema";

/**
 * Obtiene todos los planes de tratamiento
 */
export async function getPlanesTratamiento(): Promise<PlanTratamiento[]> {
  try {
    const records = await prisma.planTratamiento.findMany({
      include: {
        paciente: true,
        medicoResponsable: {
          include: { empleado: true },
        },
        etapas: {
          include: {
            servicio: true,
            seguimientos: true,
          },
          orderBy: { orden: "asc" },
        },
      },
      orderBy: { createAt: "desc" },
    });

    return records.map((r) => {
      const totalSeguimientos = r.etapas.reduce(
        (acc, e) => acc + e.seguimientos.length,
        0
      );
      const seguimientosCompletados = r.etapas.reduce(
        (acc, e) =>
          acc + e.seguimientos.filter((s) => s.estado === "REALIZADO").length,
        0
      );

      return {
        id: r.id,
        pacienteId: r.pacienteId,
        pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
        nombre: r.nombre,
        descripcion: r.descripcion,
        estado: r.estado,
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin,
        medicoResponsableId: r.medicoResponsableId,
        medicoNombre: r.medicoResponsable
          ? `${r.medicoResponsable.empleado.nombre} ${r.medicoResponsable.empleado.apellido}`
          : undefined,
        totalEtapas: r.etapas.length,
        totalSeguimientos,
        seguimientosCompletados,
      };
    });
  } catch (error) {
    console.error("Error al obtener planes de tratamiento:", error);
    return [];
  }
}

/**
 * Obtiene los planes de un paciente
 */
export async function getPlanesByPaciente(
  pacienteId: string
): Promise<PlanTratamiento[]> {
  try {
    const records = await prisma.planTratamiento.findMany({
      where: { pacienteId },
      include: {
        paciente: true,
        medicoResponsable: {
          include: { empleado: true },
        },
        etapas: {
          include: {
            servicio: true,
            seguimientos: true,
          },
          orderBy: { orden: "asc" },
        },
      },
      orderBy: { createAt: "desc" },
    });

    return records.map((r) => {
      const totalSeguimientos = r.etapas.reduce(
        (acc, e) => acc + e.seguimientos.length,
        0
      );
      const seguimientosCompletados = r.etapas.reduce(
        (acc, e) =>
          acc + e.seguimientos.filter((s) => s.estado === "REALIZADO").length,
        0
      );

      return {
        id: r.id,
        pacienteId: r.pacienteId,
        pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
        nombre: r.nombre,
        descripcion: r.descripcion,
        estado: r.estado,
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin,
        medicoResponsableId: r.medicoResponsableId,
        medicoNombre: r.medicoResponsable
          ? `${r.medicoResponsable.empleado.nombre} ${r.medicoResponsable.empleado.apellido}`
          : undefined,
        totalEtapas: r.etapas.length,
        totalSeguimientos,
        seguimientosCompletados,
      };
    });
  } catch (error) {
    console.error("Error al obtener planes del paciente:", error);
    return [];
  }
}

/**
 * Obtiene un plan por ID con todos sus detalles
 */
export async function getPlanById(
  id: string
): Promise<PlanTratamiento | null> {
  try {
    const r = await prisma.planTratamiento.findUnique({
      where: { id },
      include: {
        paciente: true,
        medicoResponsable: {
          include: { empleado: true },
        },
        etapas: {
          include: {
            servicio: true,
            responsableMedico: {
              include: { empleado: true },
            },
            seguimientos: {
              include: {
                cita: true,
              },
              orderBy: { fechaProgramada: "asc" },
            },
          },
          orderBy: { orden: "asc" },
        },
      },
    });

    if (!r) return null;

    const etapas: PlanEtapa[] = r.etapas.map((e) => ({
      id: e.id,
      planId: e.planId,
      servicioId: e.servicioId,
      servicioNombre: e.servicio.nombre,
      nombre: e.nombre,
      descripcion: e.descripcion,
      orden: e.orden,
      intervaloDias: e.intervaloDias,
      repeticiones: e.repeticiones,
      programarCita: e.programarCita,
      responsableMedicoId: e.responsableMedicoId,
      medicoNombre: e.responsableMedico
        ? `${e.responsableMedico.empleado.nombre} ${e.responsableMedico.empleado.apellido}`
        : undefined,
    }));

    const seguimientos: Seguimiento[] = r.etapas.flatMap((e) =>
      e.seguimientos.map((s) => ({
        id: s.id,
        etapaId: s.etapaId,
        pacienteId: s.pacienteId,
        fechaProgramada: s.fechaProgramada,
        fechaRealizada: s.fechaRealizada,
        estado: s.estado,
        nota: s.nota,
        citaId: s.citaId,
        etapaNombre: e.nombre,
        servicioNombre: e.servicio.nombre,
      }))
    );

    const totalSeguimientos = seguimientos.length;
    const seguimientosCompletados = seguimientos.filter(
      (s) => s.estado === "REALIZADO"
    ).length;

    return {
      id: r.id,
      pacienteId: r.pacienteId,
      pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
      nombre: r.nombre,
      descripcion: r.descripcion,
      estado: r.estado,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      medicoResponsableId: r.medicoResponsableId,
      medicoNombre: r.medicoResponsable
        ? `${r.medicoResponsable.empleado.nombre} ${r.medicoResponsable.empleado.apellido}`
        : undefined,
      etapas,
      seguimientos,
      totalEtapas: etapas.length,
      totalSeguimientos,
      seguimientosCompletados,
    };
  } catch (error) {
    console.error(`Error al obtener plan con ID ${id}:`, error);
    return null;
  }
}

/**
 * Crea un nuevo plan de tratamiento con sus etapas
 */
export async function createPlanTratamiento(
  data: PlanTratamiento
): Promise<{ success: true; data: PlanTratamiento } | { success: false; error: string }> {
  try {
    const validatedData = PlanTratamientoSchema.parse(data);
    const planId = randomUUID();

    const plan = await prisma.planTratamiento.create({
      data: {
        id: planId,
        pacienteId: validatedData.pacienteId,
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion,
        estado: validatedData.estado,
        fechaInicio: validatedData.fechaInicio,
        fechaFin: validatedData.fechaFin,
        medicoResponsableId: validatedData.medicoResponsableId || null,
        etapas: {
          create:
            validatedData.etapas?.map((e, index) => ({
              id: randomUUID(),
              servicioId: e.servicioId,
              nombre: e.nombre,
              descripcion: e.descripcion,
              orden: e.orden ?? index + 1,
              intervaloDias: e.intervaloDias,
              repeticiones: e.repeticiones,
              programarCita: e.programarCita ?? true,
              responsableMedicoId: e.responsableMedicoId || null,
            })) ?? [],
        },
      },
      include: {
        paciente: true,
        medicoResponsable: {
          include: { empleado: true },
        },
        etapas: {
          include: { servicio: true },
          orderBy: { orden: "asc" },
        },
      },
    });

    // Generar seguimientos automáticamente para cada etapa
    await generarSeguimientos(planId, validatedData.pacienteId);

    revalidatePath("/planes-tratamiento");
    revalidatePath(`/pacientes/${validatedData.pacienteId}/perfil`);

    return {
      success: true,
      data: {
        id: plan.id,
        pacienteId: plan.pacienteId,
        pacienteNombre: `${plan.paciente.nombre} ${plan.paciente.apellido}`,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        estado: plan.estado,
        fechaInicio: plan.fechaInicio,
        fechaFin: plan.fechaFin,
        medicoResponsableId: plan.medicoResponsableId,
        medicoNombre: plan.medicoResponsable
          ? `${plan.medicoResponsable.empleado.nombre} ${plan.medicoResponsable.empleado.apellido}`
          : undefined,
        totalEtapas: plan.etapas.length,
      },
    };
  } catch (error) {
    console.error("Error al crear plan de tratamiento:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al crear plan" };
  }
}

/**
 * Actualiza un plan de tratamiento
 */
export async function updatePlanTratamiento(
  id: string,
  data: Partial<PlanTratamiento>
): Promise<{ success: true; data: PlanTratamiento } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID del plan es requerido" };
    }

    // Eliminar etapas existentes y sus seguimientos
    await prisma.planEtapa.deleteMany({
      where: { planId: id },
    });

    const plan = await prisma.planTratamiento.update({
      where: { id },
      data: {
        pacienteId: data.pacienteId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        estado: data.estado,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        medicoResponsableId: data.medicoResponsableId || null,
        etapas: {
          create:
            data.etapas?.map((e, index) => ({
              id: randomUUID(),
              servicioId: e.servicioId,
              nombre: e.nombre,
              descripcion: e.descripcion,
              orden: e.orden ?? index + 1,
              intervaloDias: e.intervaloDias,
              repeticiones: e.repeticiones,
              programarCita: e.programarCita ?? true,
              responsableMedicoId: e.responsableMedicoId || null,
            })) ?? [],
        },
      },
      include: {
        paciente: true,
        medicoResponsable: {
          include: { empleado: true },
        },
        etapas: {
          include: { servicio: true },
          orderBy: { orden: "asc" },
        },
      },
    });

    // Regenerar seguimientos
    if (data.pacienteId) {
      await generarSeguimientos(id, data.pacienteId);
    }

    revalidatePath("/planes-tratamiento");
    revalidatePath(`/planes-tratamiento/${id}`);
    revalidatePath(`/pacientes/${plan.pacienteId}/perfil`);

    return {
      success: true,
      data: {
        id: plan.id,
        pacienteId: plan.pacienteId,
        pacienteNombre: `${plan.paciente.nombre} ${plan.paciente.apellido}`,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        estado: plan.estado,
        fechaInicio: plan.fechaInicio,
        fechaFin: plan.fechaFin,
        medicoResponsableId: plan.medicoResponsableId,
        medicoNombre: plan.medicoResponsable
          ? `${plan.medicoResponsable.empleado.nombre} ${plan.medicoResponsable.empleado.apellido}`
          : undefined,
        totalEtapas: plan.etapas.length,
      },
    };
  } catch (error) {
    console.error(`Error al actualizar plan con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al actualizar plan" };
  }
}

/**
 * Elimina un plan de tratamiento
 */
export async function deletePlanTratamiento(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID del plan es requerido" };
    }

    await prisma.planTratamiento.delete({
      where: { id },
    });

    revalidatePath("/planes-tratamiento");

    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar plan con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al eliminar plan" };
  }
}

/**
 * Actualiza el estado de un plan
 */
export async function updateEstadoPlan(
  id: string,
  estado: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.planTratamiento.update({
      where: { id },
      data: {
        estado,
        fechaFin: estado === "COMPLETADO" || estado === "CANCELADO" ? new Date() : null,
      },
    });

    revalidatePath("/planes-tratamiento");
    revalidatePath(`/planes-tratamiento/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`Error al actualizar estado del plan ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido" };
  }
}

/**
 * Genera seguimientos automáticamente para las etapas de un plan
 */
async function generarSeguimientos(
  planId: string,
  pacienteId: string
): Promise<void> {
  try {
    const etapas = await prisma.planEtapa.findMany({
      where: { planId },
      orderBy: { orden: "asc" },
    });

    const plan = await prisma.planTratamiento.findUnique({
      where: { id: planId },
    });

    if (!plan) return;

    let fechaBase = new Date(plan.fechaInicio);

    for (const etapa of etapas) {
      const repeticiones = etapa.repeticiones ?? 1;
      const intervaloDias = etapa.intervaloDias ?? 30;

      for (let i = 0; i < repeticiones; i++) {
        const fechaProgramada = new Date(fechaBase);
        fechaProgramada.setDate(fechaProgramada.getDate() + intervaloDias * i);

        await prisma.seguimiento.create({
          data: {
            id: randomUUID(),
            etapaId: etapa.id,
            pacienteId,
            fechaProgramada,
            estado: "PROGRAMADO",
          },
        });
      }

      // Mover la fecha base para la siguiente etapa
      fechaBase.setDate(
        fechaBase.getDate() + intervaloDias * repeticiones
      );
    }
  } catch (error) {
    console.error("Error al generar seguimientos:", error);
  }
}

/**
 * Actualiza el estado de un seguimiento
 */
export async function updateSeguimiento(
  id: string,
  data: {
    estado?: string;
    fechaRealizada?: Date | null;
    nota?: string | null;
    citaId?: string | null;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const seguimiento = await prisma.seguimiento.update({
      where: { id },
      data: {
        estado: data.estado,
        fechaRealizada: data.fechaRealizada,
        nota: data.nota,
        citaId: data.citaId,
      },
      include: {
        etapa: {
          include: { plan: true },
        },
      },
    });

    revalidatePath("/planes-tratamiento");
    revalidatePath(`/planes-tratamiento/${seguimiento.etapa.planId}`);

    return { success: true };
  } catch (error) {
    console.error(`Error al actualizar seguimiento ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido" };
  }
}

/**
 * Obtiene los seguimientos pendientes de un paciente
 */
export async function getSeguimientosPendientes(
  pacienteId: string
): Promise<Seguimiento[]> {
  try {
    const records = await prisma.seguimiento.findMany({
      where: {
        pacienteId,
        estado: "PROGRAMADO",
      },
      include: {
        etapa: {
          include: {
            servicio: true,
            plan: true,
          },
        },
      },
      orderBy: { fechaProgramada: "asc" },
    });

    return records.map((s) => ({
      id: s.id,
      etapaId: s.etapaId,
      pacienteId: s.pacienteId,
      fechaProgramada: s.fechaProgramada,
      fechaRealizada: s.fechaRealizada,
      estado: s.estado,
      nota: s.nota,
      citaId: s.citaId,
      etapaNombre: s.etapa.nombre,
      servicioNombre: s.etapa.servicio.nombre,
    }));
  } catch (error) {
    console.error("Error al obtener seguimientos pendientes:", error);
    return [];
  }
}

/**
 * Obtiene servicios activos para el select
 */
export async function getServiciosActivos(): Promise<
  { id: string; nombre: string; precioBase: number; duracionMin: number }[]
> {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        precioBase: true,
        duracionMin: true,
      },
      orderBy: { nombre: "asc" },
    });

    return servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      precioBase: Number(s.precioBase),
      duracionMin: s.duracionMin,
    }));
  } catch (error) {
    console.error("Error al obtener servicios activos:", error);
    return [];
  }
}
