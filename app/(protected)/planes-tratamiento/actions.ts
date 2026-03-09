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
import { PlanEstado, SeguimientoEstado } from "@/lib/generated/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";
import { getTenantContext } from "@/lib/tenant";
import { EmailService } from "@/lib/sendEmail";
import { generatePlanEmailHtml } from "@/lib/templates/clinical-notifications";
import { getTenantEmailBranding } from "@/lib/tenant-branding";
import { buildDoctorFromAddress, resolveDoctorSenderName } from "@/lib/doctor-mailer";

/**
 * Genera seguimientos automáticamente para las etapas de un plan
 */
async function generarSeguimientos(planId: string, pacienteId: string) {
  const etapas = await prisma.planEtapa.findMany({
    where: await tenantWhere<Prisma.PlanEtapaWhereInput>({ planId }),
    orderBy: { orden: "asc" },
  });
  const plan = await prisma.planTratamiento.findFirst({
    where: await tenantWhere<Prisma.PlanTratamientoWhereInput>({ id: planId }),
  });
  if (!plan || !plan.fechaInicio) return;

  const fechaBase = new Date(plan.fechaInicio);

  for (const etapa of etapas) {
    const repeticiones = etapa.repeticiones ?? 1;
    const intervalo = etapa.intervaloDias ?? 30;

    for (let i = 0; i < repeticiones; i++) {
      const fechaProgramada = new Date(fechaBase);
      fechaProgramada.setDate(fechaProgramada.getDate() + i * intervalo);

      await prisma.seguimiento.create({
        data: await withTenantData({
          id: randomUUID(),
          etapaId: etapa.id,
          pacienteId,
          fechaProgramada,
          estado: "PENDIENTE" as SeguimientoEstado,
        }),
      });
    }

    fechaBase.setDate(fechaBase.getDate() + (repeticiones * intervalo));
  }
}

/**
 * Obtiene todos los planes de tratamiento
 */
export async function getPlanesTratamiento(): Promise<PlanTratamiento[]> {
  try {
    const records = await prisma.planTratamiento.findMany({
      where: await tenantWhere<Prisma.PlanTratamientoWhereInput>(),
      include: {
        paciente: true,
        medicoResponsable: { include: { empleado: true } },
        etapas: {
          include: {
            servicios: { include: { servicio: true } },
            seguimientos: true,
          },
          orderBy: { orden: "asc" },
        },
      },
      orderBy: { createAt: "desc" },
    });

    return records.map((r) => {
      const etapas: PlanEtapa[] = r.etapas.map((e) => ({
        id: e.id,
        planId: e.planId,
        servicios: e.servicios.map((s) => ({
          id: s.id,
          servicioId: s.servicioId,
          precioAplicado: Number(s.precioAplicado),
          cantidad: s.cantidad,
          servicioNombre: s.servicio.nombre,
        })),
        servicioNombre: e.servicios.map((s) => s.servicio.nombre).join(", "),
        nombre: e.nombre,
        descripcion: e.descripcion,
        orden: e.orden,
        intervaloDias: e.intervaloDias ?? null,
        repeticiones: e.repeticiones ?? null,
        programarCita: e.programarCita,
        responsableMedicoId: e.responsableMedicoId ?? null,
        medicoNombre: e.responsableMedicoId ? undefined : undefined,
      }));

      const seguimientos: Seguimiento[] = r.etapas.flatMap((e) =>
        e.seguimientos.map((s) => ({
          id: s.id,
          etapaId: s.etapaId,
          pacienteId: s.pacienteId,
          fechaProgramada: s.fechaProgramada,
          fechaRealizada: s.fechaRealizada ?? null,
          estado: s.estado as SeguimientoEstado,
          nota: s.nota ?? null,
          citaId: s.citaId ?? null,
          etapaNombre: e.nombre,
          servicioNombre: e.servicios.map((servicio) => servicio.servicio.nombre).join(", "),
        }))
      );

      const totalSeguimientos = seguimientos.length;
      const seguimientosCompletados = seguimientos.filter((s) => s.estado === "REALIZADO").length;

      return {
        id: r.id,
        pacienteId: r.pacienteId,
        pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
        nombre: r.nombre,
        descripcion: r.descripcion,
        estado: r.estado as PlanEstado,
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin ?? null,
        medicoResponsableId: r.medicoResponsableId ?? null,
        medicoNombre: r.medicoResponsable
          ? `${r.medicoResponsable.empleado.nombre} ${r.medicoResponsable.empleado.apellido}`
          : undefined,
        etapas,
        seguimientos,
        totalEtapas: etapas.length,
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
export async function getPlanesByPaciente(pacienteId: string): Promise<PlanTratamiento[]> {
  const planes = await getPlanesTratamiento();
  return planes.filter((p) => p.pacienteId === pacienteId);
}

/**
 * Obtiene un plan por ID con todos sus detalles
 */
export async function getPlanById(id: string): Promise<PlanTratamiento | null> {
  const planes = await getPlanesTratamiento();
  return planes.find((p) => p.id === id) ?? null;
}

/**
 * Crea un nuevo plan de tratamiento con sus etapas
 */
export async function createPlanTratamiento(
  data: PlanTratamiento,
  options?: { sendEmailToPaciente?: boolean }
): Promise<{ success: true; data: PlanTratamiento } | { success: false; error: string }> {
  try {
    const validatedData = PlanTratamientoSchema.parse(data);
    const planId = randomUUID();
    const { tenantId } = await getTenantContext();

    const plan = await prisma.planTratamiento.create({
      data: await withTenantData({
        id: planId,
        pacienteId: validatedData.pacienteId,
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion ?? null,
        estado: (validatedData.estado ?? "ACTIVO") as PlanEstado,
        fechaInicio: validatedData.fechaInicio,
        fechaFin: validatedData.fechaFin ?? null,
        medicoResponsableId: validatedData.medicoResponsableId ?? null,
        etapas: {
          create:
            validatedData.etapas?.map((e, index) => ({
              id: randomUUID(),
              nombre: e.nombre,
              descripcion: e.descripcion ?? null,
              orden: e.orden ?? index + 1,
              intervaloDias: e.intervaloDias ?? null,
              repeticiones: e.repeticiones ?? null,
              programarCita: e.programarCita ?? true,
              tenantId,
              responsableMedicoId: e.responsableMedicoId ?? null,
              servicios: {
                create: e.servicios.map((servicio) => ({
                  id: randomUUID(),
                  tenantId,
                  servicioId: servicio.servicioId,
                  precioAplicado: servicio.precioAplicado,
                  cantidad: servicio.cantidad,
                })),
              },
            })) ?? [],
        },
      }),
      include: {
        paciente: true,
        medicoResponsable: { include: { empleado: true } },
        etapas: true,
      },
    });

    // Generar seguimientos
    await generarSeguimientos(plan.id, plan.pacienteId);

    if (options?.sendEmailToPaciente) {
      if (!plan.paciente.correo) {
        return { success: false, error: "El paciente no tiene correo registrado para enviar el plan." };
      }

      const doctorName = await resolveDoctorSenderName();
      const { clinicLogoBase64, tenantName } = await getTenantEmailBranding();
      const emailService = new EmailService();

      await emailService.sendMail({
        to: plan.paciente.correo,
        from: buildDoctorFromAddress(doctorName),
        subject: `Plan de tratamiento - Dr(a). ${doctorName}`,
        html: generatePlanEmailHtml({
          pacienteNombre: `${plan.paciente.nombre} ${plan.paciente.apellido}`,
          medicoNombre: doctorName,
          planNombre: plan.nombre,
          fechaInicio: plan.fechaInicio,
          estado: plan.estado,
          etapas: (validatedData.etapas ?? []).map((etapa) => etapa.nombre),
          clinicLogoBase64,
          tenantName,
        }),
      });
    }

    revalidatePath("/planes-tratamiento");
    revalidatePath(`/pacientes/${plan.pacienteId}/perfil`);

    return { success: true, data: { ...plan, pacienteNombre: `${plan.paciente.nombre} ${plan.paciente.apellido}`, etapas: [], seguimientos: [] } };
  } catch (error) {
    console.error("Error al crear plan de tratamiento:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
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
    if (!id) return { success: false, error: "ID del plan es requerido" };
    const { tenantId } = await getTenantContext();

    // Eliminar etapas existentes y sus seguimientos
    await prisma.planEtapa.deleteMany({ where: await tenantWhere<Prisma.PlanEtapaWhereInput>({ planId: id }) });

    const existingPlan = await prisma.planTratamiento.findFirst({
      where: await tenantWhere<Prisma.PlanTratamientoWhereInput>({ id }),
      select: { id: true },
    });

    if (!existingPlan) return { success: false, error: "Plan no válido para este tenant" };

    const plan = await prisma.planTratamiento.update({
      where: { id: existingPlan.id },
      data: {
        pacienteId: data.pacienteId,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        estado: (data.estado ?? "ACTIVO") as PlanEstado,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin ?? null,
        medicoResponsableId: data.medicoResponsableId ?? null,
        etapas: {
          create:
            data.etapas?.map((e, index) => ({
              id: randomUUID(),
              nombre: e.nombre,
              descripcion: e.descripcion ?? null,
              orden: e.orden ?? index + 1,
              intervaloDias: e.intervaloDias ?? null,
              repeticiones: e.repeticiones ?? null,
              programarCita: e.programarCita ?? true,
              tenantId,
              responsableMedicoId: e.responsableMedicoId ?? null,
              servicios: {
                create: e.servicios.map((servicio) => ({
                  id: randomUUID(),
                  tenantId,
                  servicioId: servicio.servicioId,
                  precioAplicado: servicio.precioAplicado,
                  cantidad: servicio.cantidad,
                })),
              },
            })) ?? [],
        },
      },
      include: { paciente: true, medicoResponsable: { include: { empleado: true } }, etapas: true },
    });

    if (data.pacienteId) await generarSeguimientos(id, data.pacienteId);

    revalidatePath("/planes-tratamiento");
    revalidatePath(`/planes-tratamiento/${id}`);
    revalidatePath(`/pacientes/${plan.pacienteId}/perfil`);

    return { success: true, data: { ...plan, pacienteNombre: `${plan.paciente.nombre} ${plan.paciente.apellido}`, etapas: [], seguimientos: [] } };
  } catch (error) {
    console.error(`Error al actualizar plan con ID ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar plan" };
  }
}

/**
 * Elimina un plan de tratamiento
 */
export async function deletePlanTratamiento(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) return { success: false, error: "ID del plan es requerido" };
    const deleted = await prisma.planTratamiento.deleteMany({ where: await tenantWhere<Prisma.PlanTratamientoWhereInput>({ id }) });
    if (deleted.count === 0) return { success: false, error: "Plan no válido para este tenant" };
    revalidatePath("/planes-tratamiento");
    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar plan con ID ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar plan" };
  }
}

/**
 * Actualiza el estado de un plan
 */
export async function updateEstadoPlan(id: string, estado: PlanEstado): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const updated = await prisma.planTratamiento.updateMany({
      where: await tenantWhere<Prisma.PlanTratamientoWhereInput>({ id }),
      data: { estado, fechaFin: estado === "COMPLETADO" || estado === "CANCELADO" ? new Date() : null },
    });

    if (updated.count === 0) return { success: false, error: "Plan no válido para este tenant" };
    revalidatePath("/planes-tratamiento");
    revalidatePath(`/planes-tratamiento/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error al actualizar estado del plan ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

/**
 * Envía un plan de tratamiento por correo desde la tabla de acciones
 */
export async function sendPlanTratamientoEmail(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) return { success: false, error: "ID del plan es requerido" };

    const plan = await prisma.planTratamiento.findFirst({
      where: await tenantWhere<Prisma.PlanTratamientoWhereInput>({ id }),
      include: {
        paciente: { select: { nombre: true, apellido: true, correo: true } },
        etapas: { select: { nombre: true }, orderBy: { orden: "asc" } },
      },
    });

    if (!plan) return { success: false, error: "Plan no válido para este tenant" };
    if (!plan.paciente?.correo) {
      return { success: false, error: "El paciente no tiene correo registrado para enviar el plan." };
    }

    const doctorName = await resolveDoctorSenderName();
    const { clinicLogoBase64, tenantName } = await getTenantEmailBranding();
    const emailService = new EmailService();

    await emailService.sendMail({
      to: plan.paciente.correo,
      from: buildDoctorFromAddress(doctorName),
      subject: `Plan de tratamiento - Dr(a). ${doctorName}`,
      html: generatePlanEmailHtml({
        pacienteNombre: `${plan.paciente.nombre} ${plan.paciente.apellido}`,
        medicoNombre: doctorName,
        planNombre: plan.nombre,
        fechaInicio: plan.fechaInicio,
        estado: plan.estado,
        etapas: plan.etapas.map((etapa) => etapa.nombre),
        clinicLogoBase64,
        tenantName,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error(`Error al enviar plan por email ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

/**
 * Actualiza un seguimiento
 */
export async function updateSeguimiento(
  id: string,
  data: { estado?: SeguimientoEstado; fechaRealizada?: Date | null; nota?: string | null; citaId?: string | null }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const seguimiento = await prisma.seguimiento.findFirst({
      where: await tenantWhere<Prisma.SeguimientoWhereInput>({ id }),
      include: { etapa: { include: { plan: true } } },
    });

    if (!seguimiento) return { success: false, error: "Seguimiento no válido para este tenant" };

    await prisma.seguimiento.update({
      where: { id: seguimiento.id },
      data: { estado: data.estado, fechaRealizada: data.fechaRealizada ?? null, nota: data.nota ?? null, citaId: data.citaId ?? null },
    });
    revalidatePath("/planes-tratamiento");
    revalidatePath(`/planes-tratamiento/${seguimiento.etapa.planId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error al actualizar seguimiento ${id}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

/**
 * Obtiene seguimientos pendientes de un paciente
 */
export async function getSeguimientosPendientes(pacienteId: string): Promise<Seguimiento[]> {
  try {
    const records = await prisma.seguimiento.findMany({
      where: await tenantWhere<Prisma.SeguimientoWhereInput>({ pacienteId, estado: "PENDIENTE" }),
      include: {
        etapa: {
          include: {
            servicios: { include: { servicio: true } },
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
      fechaRealizada: s.fechaRealizada ?? null,
      estado: s.estado as SeguimientoEstado,
      nota: s.nota ?? null,
      citaId: s.citaId ?? null,
      planNombre: s.etapa.plan.nombre,
      etapaNombre: s.etapa.nombre,
      servicioNombre: s.etapa.servicios
        .map((servicio) => servicio.servicio.nombre)
        .join(", "),
      servicios: s.etapa.servicios.map((servicio) => ({
        id: servicio.id,
        servicioId: servicio.servicioId,
        precioAplicado: Number(servicio.precioAplicado),
        cantidad: servicio.cantidad,
        servicioNombre: servicio.servicio.nombre,
      })),
    }));
  } catch (error) {
    console.error("Error al obtener seguimientos pendientes:", error);
    return [];
  }
}

/**
 * Obtiene servicios activos para select
 */
export async function getServiciosActivos(): Promise<{ id: string; nombre: string; precioBase: number; duracionMin: number }[]> {
  try {
    const servicios = await prisma.servicio.findMany({
      where: await tenantWhere<Prisma.ServicioWhereInput>({ activo: true }),
      select: { id: true, nombre: true, precioBase: true, duracionMin: true },
      orderBy: { nombre: "asc" },
    });

    return servicios.map((s) => ({ id: s.id, nombre: s.nombre, precioBase: Number(s.precioBase), duracionMin: s.duracionMin }));
  } catch (error) {
    console.error("Error al obtener servicios activos:", error);
    return [];
  }
}
