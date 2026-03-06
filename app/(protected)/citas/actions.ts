/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Cita, CitaSchema } from "./schema";
import { paginate } from "@/app/type";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";
import { EmailService } from "@/lib/sendEmail";
import { generateAppointmentEmailHtml } from "@/lib/templates/clinical-notifications";
import { buildDoctorFromAddress, resolveDoctorSenderName } from "@/lib/doctor-mailer";

/**
 * Obtiene todas las citas con paginacion
 */
export async function getCitas({
  page = 1,
  pageSize = 10,
  from,
  to,
}: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}) {
  try {
    const where = await tenantWhere<Prisma.CitaWhereInput>(buildFechaRangeFilter(from, to));
    const result = await paginate<any, Prisma.CitaWhereInput>({
      model: prisma.cita,
      page,
      pageSize,
      orderBy: { fechaHora: "desc" },
      where,
      select: {
        id: true,
        pacienteId: true,
        medicoId: true,
        consultorioId: true,
        fechaHora: true,
        estado: true,
        motivo: true,
        observacion: true,
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            identidad: true,
          },
        },
        medico: {
          select: {
            idEmpleado: true,
            empleado: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        consultorio: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    const citas: Cita[] = result.data.map((r: any) => ({
      id: r.id,
      pacienteId: r.pacienteId,
      medicoId: r.medicoId,
      consultorioId: r.consultorioId,
      fechaHora: new Date(r.fechaHora),
      estado: r.estado,
      motivo: r.motivo,
      observacion: r.observacion,
      paciente: r.paciente,
      medico: r.medico,
      consultorio: r.consultorio,
    }));

    return {
      data: citas,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.pageCount,
    };
  } catch (error) {
    console.error("Error al obtener las citas:", error);
    return {
      data: [] as Cita[],
      total: 0,
      page,
      pageSize,
      pageCount: 0,
    };
  }
}

function buildFechaRangeFilter(
  from?: string,
  to?: string
): Prisma.CitaWhereInput | undefined {
  if (!from && !to) return undefined;

  const fechaHora: Prisma.DateTimeFilter = {};

  if (from) {
    const start = new Date(from + "T00:00:00.000");
    fechaHora.gte = start;
  }

  if (to) {
    const end = new Date(to + "T23:59:59.999");
    fechaHora.lte = end;
  }

  return { fechaHora };
}


/**
 * Obtiene citas para calendario en un rango sin paginacion
 */
export async function getCitasPorRango({
  from,
  to,
}: {
  from: Date;
  to: Date;
}): Promise<Cita[]> {
  try {
    const records = await prisma.cita.findMany({
      where: await tenantWhere<Prisma.CitaWhereInput>({
        fechaHora: {
          gte: from,
          lte: to,
        },
      }),
      orderBy: { fechaHora: "asc" },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            identidad: true,
          },
        },
        medico: {
          select: {
            idEmpleado: true,
            empleado: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        consultorio: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return records.map((r) => ({
      id: r.id,
      pacienteId: r.pacienteId,
      medicoId: r.medicoId,
      consultorioId: r.consultorioId,
      fechaHora: new Date(r.fechaHora),
      estado: r.estado,
      motivo: r.motivo,
      observacion: r.observacion,
      paciente: r.paciente,
      medico: r.medico,
      consultorio: r.consultorio,
    }));
  } catch (error) {
    console.error("Error al obtener citas por rango:", error);
    return [];
  }
}

/**
 * Obtiene las citas de un paciente especifico
 */
export async function getCitasByPaciente(pacienteId: string): Promise<Cita[]> {
  try {
    const records = await prisma.cita.findMany({
      where: await tenantWhere<Prisma.CitaWhereInput>({ pacienteId }),
      orderBy: { fechaHora: "desc" },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            identidad: true,
          },
        },
        medico: {
          select: {
            idEmpleado: true,
            empleado: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        consultorio: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return records.map((r) => ({
      id: r.id,
      pacienteId: r.pacienteId,
      medicoId: r.medicoId,
      consultorioId: r.consultorioId,
      fechaHora: new Date(r.fechaHora),
      estado: r.estado,
      motivo: r.motivo,
      observacion: r.observacion,
      paciente: r.paciente,
      medico: r.medico,
      consultorio: r.consultorio,
    }));
  } catch (error) {
    console.error("Error al obtener citas del paciente:", error);
    return [];
  }
}

/**
 * Obtiene una cita por ID
 */
export async function getCitaById(id: string): Promise<Cita | null> {
  try {
    const r = await prisma.cita.findFirst({
      where: await tenantWhere<Prisma.CitaWhereInput>({ id }),
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            identidad: true,
          },
        },
        medico: {
          select: {
            idEmpleado: true,
            empleado: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        consultorio: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      pacienteId: r.pacienteId,
      medicoId: r.medicoId,
      consultorioId: r.consultorioId,
      fechaHora: new Date(r.fechaHora),
      estado: r.estado,
      motivo: r.motivo,
      observacion: r.observacion,
      paciente: r.paciente,
      medico: r.medico,
      consultorio: r.consultorio,
    };
  } catch (error) {
    console.error(`Error al obtener cita con ID ${id}:`, error);
    return null;
  }
}


export async function getSeguimientoContextoParaCita(seguimientoId: string): Promise<
  | {
      id: string;
      pacienteId: string;
      motivo: string;
    }
  | null
> {
  try {
    const seguimiento = await prisma.seguimiento.findFirst({
      where: await tenantWhere<Prisma.SeguimientoWhereInput>({ id: seguimientoId, estado: "PENDIENTE" }),
      include: {
        etapa: {
          include: {
            plan: true,
            servicios: { include: { servicio: true } },
          },
        },
      },
    });

    if (!seguimiento) return null;

    const servicios = seguimiento.etapa.servicios
      .map((item) => item.servicio.nombre)
      .join(", ");

    return {
      id: seguimiento.id,
      pacienteId: seguimiento.pacienteId,
      motivo: `Seguimiento ${seguimiento.etapa.nombre} (${servicios || "Sin servicios"}) - Plan ${seguimiento.etapa.plan.nombre}`,
    };
  } catch (error) {
    console.error(`Error al obtener seguimiento ${seguimientoId}:`, error);
    return null;
  }
}

/**
 * Crea una nueva cita
 */
export async function createCita(
  data: Cita,
  options?: { sendEmailToPaciente?: boolean }
): Promise<{ success: true; data: Cita } | { success: false; error: string }> {
  try {
    const validatedData = CitaSchema.parse({
      ...data,
      estado: data.estado || "programada",
    });

    const id = randomUUID();
    const r = await prisma.cita.create({
      data: await withTenantData({
        id: id,
        pacienteId: validatedData.pacienteId,
        medicoId: validatedData.medicoId,
        consultorioId: validatedData.consultorioId,
        fechaHora: new Date(validatedData.fechaHora),
        estado: validatedData.estado,
        motivo: validatedData.motivo,
        observacion: validatedData.observacion,
      }),
      include: {
        paciente: { select: { nombre: true, apellido: true, correo: true } },
        medico: { include: { empleado: { select: { nombre: true, apellido: true } } } },
        consultorio: { select: { nombre: true } },
      },
    });


    if (options?.sendEmailToPaciente) {
      if (!r.paciente?.correo) {
        return { success: false, error: "El paciente no tiene correo registrado para enviar la cita." };
      }

      const doctorName = `${r.medico?.empleado?.nombre ?? ""} ${r.medico?.empleado?.apellido ?? ""}`.trim() || await resolveDoctorSenderName();
      const emailService = new EmailService();

      await emailService.sendMail({
        to: r.paciente.correo,
        from: buildDoctorFromAddress(doctorName),
        subject: `Confirmación de cita - Dr(a). ${doctorName}`,
        html: generateAppointmentEmailHtml({
          pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
          medicoNombre: doctorName,
          consultorioNombre: r.consultorio.nombre,
          fechaHora: new Date(r.fechaHora),
          motivo: r.motivo,
          observacion: r.observacion,
        }),
      });
    }

    const result = {
      id: r.id,
      pacienteId: r.pacienteId,
      medicoId: r.medicoId,
      consultorioId: r.consultorioId,
      fechaHora: new Date(r.fechaHora),
      estado: r.estado,
      motivo: r.motivo,
      observacion: r.observacion,
    };

    revalidatePath("/citas");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al crear cita:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al crear cita" };
  }
}

/**
 * Actualiza una cita existente
 */
export async function updateCita(
  id: string,
  data: Partial<Cita>
): Promise<{ success: true; data: Cita } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID de la cita es requerido" };
    }

    const validatedData = CitaSchema.partial().parse(data);

    const existing = await prisma.cita.findFirst({ where: await tenantWhere<Prisma.CitaWhereInput>({ id }) });
    if (!existing) return { success: false, error: "Cita no encontrada en la clínica" };

    const r = await prisma.cita.update({
      where: { id: existing.id },
      data: {
        ...(validatedData.pacienteId && { pacienteId: validatedData.pacienteId }),
        ...(validatedData.medicoId && { medicoId: validatedData.medicoId }),
        ...(validatedData.consultorioId && { consultorioId: validatedData.consultorioId }),
        ...(validatedData.fechaHora !== undefined && { fechaHora: new Date(validatedData.fechaHora) }),
        ...(validatedData.estado !== undefined && { estado: validatedData.estado }),
        ...(validatedData.motivo !== undefined && { motivo: validatedData.motivo }),
        ...(validatedData.observacion !== undefined && { observacion: validatedData.observacion }),
      },
    });


    if (options?.sendEmailToPaciente) {
      if (!r.paciente?.correo) {
        return { success: false, error: "El paciente no tiene correo registrado para enviar la cita." };
      }

      const doctorName = `${r.medico?.empleado?.nombre ?? ""} ${r.medico?.empleado?.apellido ?? ""}`.trim() || await resolveDoctorSenderName();
      const emailService = new EmailService();

      await emailService.sendMail({
        to: r.paciente.correo,
        from: buildDoctorFromAddress(doctorName),
        subject: `Confirmación de cita - Dr(a). ${doctorName}`,
        html: generateAppointmentEmailHtml({
          pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
          medicoNombre: doctorName,
          consultorioNombre: r.consultorio.nombre,
          fechaHora: new Date(r.fechaHora),
          motivo: r.motivo,
          observacion: r.observacion,
        }),
      });
    }

    const result = {
      id: r.id,
      pacienteId: r.pacienteId,
      medicoId: r.medicoId,
      consultorioId: r.consultorioId,
      fechaHora: new Date(r.fechaHora),
      estado: r.estado,
      motivo: r.motivo,
      observacion: r.observacion,
    };

    revalidatePath("/citas");
    revalidatePath(`/citas/${id}/edit`);

    return { success: true, data: result };
  } catch (error) {
    console.error(`Error al actualizar cita con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al actualizar cita" };
  }
}

/**
 * Elimina una cita por ID
 */
export async function deleteCita(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID de la cita es requerido" };
    }

    await prisma.cita.deleteMany({
      where: await tenantWhere<Prisma.CitaWhereInput>({ id }),
    });

    revalidatePath("/citas");

    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar cita con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al eliminar cita" };
  }
}

/**
 * Cambia el estado de una cita
 */
export async function cambiarEstadoCita(
  id: string,
  estado: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID de la cita es requerido" };
    }

    const existing = await prisma.cita.findFirst({ where: await tenantWhere<Prisma.CitaWhereInput>({ id }) });
    if (!existing) return { success: false, error: "Cita no encontrada en la clínica" };

    await prisma.cita.update({
      where: { id: existing.id },
      data: { estado },
    });

    revalidatePath("/citas");

    return { success: true };
  } catch (error) {
    console.error(`Error al cambiar estado de cita con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al cambiar estado" };
  }
}
