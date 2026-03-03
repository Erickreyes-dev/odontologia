"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Cotizacion, CotizacionSchema } from "./schema";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";

/**
 * Obtiene todas las cotizaciones
 */
export async function getCotizaciones(): Promise<Cotizacion[]> {
  try {
    const records = await prisma.cotizacion.findMany({
      where: await tenantWhere<Prisma.CotizacionWhereInput>(),
      include: {
        paciente: true,
        detalles: {
          include: {
            servicio: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return records.map((r) => ({
      id: r.id,
      pacienteId: r.pacienteId,
      pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
      fecha: r.fecha,
      estado: r.estado,
      total: Number(r.total),
      observacion: r.observacion,
      detalles: r.detalles.map((d) => ({
        id: d.id,
        cotizacionId: d.cotizacionId,
        servicioId: d.servicioId,
        servicioNombre: d.servicio.nombre,
        precioUnitario: Number(d.precioUnitario),
        cantidad: d.cantidad,
        observacion: d.observacion,
      })),
    }));
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error);
    return [];
  }
}

/**
 * Obtiene las cotizaciones de un paciente
 */
export async function getCotizacionesByPaciente(
  pacienteId: string
): Promise<Cotizacion[]> {
  try {
    const records = await prisma.cotizacion.findMany({
      where: await tenantWhere<Prisma.CotizacionWhereInput>({ pacienteId }),
      include: {
        paciente: true,
        detalles: {
          include: {
            servicio: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return records.map((r) => ({
      id: r.id,
      pacienteId: r.pacienteId,
      pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
      fecha: r.fecha,
      estado: r.estado,
      total: Number(r.total),
      observacion: r.observacion,
      detalles: r.detalles.map((d) => ({
        id: d.id,
        cotizacionId: d.cotizacionId,
        servicioId: d.servicioId,
        servicioNombre: d.servicio.nombre,
        precioUnitario: Number(d.precioUnitario),
        cantidad: d.cantidad,
        observacion: d.observacion,
      })),
    }));
  } catch (error) {
    console.error("Error al obtener cotizaciones del paciente:", error);
    return [];
  }
}

/**
 * Obtiene una cotización por ID
 */
export async function getCotizacionById(
  id: string
): Promise<Cotizacion | null> {
  try {
    const r = await prisma.cotizacion.findFirst({
      where: await tenantWhere<Prisma.CotizacionWhereInput>({ id }),
      include: {
        paciente: true,
        detalles: {
          include: {
            servicio: true,
          },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      pacienteId: r.pacienteId,
      pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
      fecha: r.fecha,
      estado: r.estado,
      total: Number(r.total),
      observacion: r.observacion,
      detalles: r.detalles.map((d) => ({
        id: d.id,
        cotizacionId: d.cotizacionId,
        servicioId: d.servicioId,
        servicioNombre: d.servicio.nombre,
        precioUnitario: Number(d.precioUnitario),
        cantidad: d.cantidad,
        observacion: d.observacion,
      })),
    };
  } catch (error) {
    console.error(`Error al obtener cotización con ID ${id}:`, error);
    return null;
  }
}

/**
 * Crea una nueva cotización con sus detalles
 */
export async function createCotizacion(
  data: Cotizacion
): Promise<{ success: true; data: Cotizacion } | { success: false; error: string }> {
  try {
    const validatedData = CotizacionSchema.parse(data);
    const id = randomUUID();

    // Calcular el total basado en los detalles
    const total =
      validatedData.detalles?.reduce(
        (acc, d) => acc + d.precioUnitario * d.cantidad,
        0
      ) ?? 0;

    const cotizacion = await prisma.cotizacion.create({
      data: await withTenantData({
        id,
        pacienteId: validatedData.pacienteId,
        fecha: validatedData.fecha,
        estado: validatedData.estado,
        total,
        observacion: validatedData.observacion,
        detalles: {
          create:
            validatedData.detalles?.map((d) => ({
              id: randomUUID(),
              servicioId: d.servicioId,
              precioUnitario: d.precioUnitario,
              cantidad: d.cantidad,
              observacion: d.observacion,
            })) ?? [],
        },
      }),
      include: {
        paciente: true,
        detalles: {
          include: {
            servicio: true,
          },
        },
      },
    });

    revalidatePath("/cotizaciones");
    revalidatePath(`/pacientes/${validatedData.pacienteId}/perfil`);

    return {
      success: true,
      data: {
        id: cotizacion.id,
        pacienteId: cotizacion.pacienteId,
        pacienteNombre: `${cotizacion.paciente.nombre} ${cotizacion.paciente.apellido}`,
        fecha: cotizacion.fecha,
        estado: cotizacion.estado,
        total: Number(cotizacion.total),
        observacion: cotizacion.observacion,
        detalles: cotizacion.detalles.map((d) => ({
          id: d.id,
          cotizacionId: d.cotizacionId,
          servicioId: d.servicioId,
          servicioNombre: d.servicio.nombre,
          precioUnitario: Number(d.precioUnitario),
          cantidad: d.cantidad,
          observacion: d.observacion,
        })),
      },
    };
  } catch (error) {
    console.error("Error al crear cotización:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al crear cotización" };
  }
}

/**
 * Actualiza una cotización existente
 */
export async function updateCotizacion(
  id: string,
  data: Partial<Cotizacion>
): Promise<{ success: true; data: Cotizacion } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID de la cotización es requerido" };
    }

    // Calcular el total basado en los detalles
    const total =
      data.detalles?.reduce(
        (acc, d) => acc + d.precioUnitario * d.cantidad,
        0
      ) ?? data.total ?? 0;

    // Primero eliminamos los detalles existentes
    const existing = await prisma.cotizacion.findFirst({ where: await tenantWhere<Prisma.CotizacionWhereInput>({ id }) });
    if (!existing) return { success: false, error: "Cotización no encontrada en la clínica" };

    await prisma.cotizacionServicio.deleteMany({
      where: await tenantWhere<Prisma.CotizacionServicioWhereInput>({ cotizacionId: existing.id }),
    });

    // Luego actualizamos la cotización con los nuevos detalles
    const cotizacion = await prisma.cotizacion.update({
      where: { id: existing.id },
      data: {
        pacienteId: data.pacienteId,
        fecha: data.fecha,
        estado: data.estado,
        total,
        observacion: data.observacion,
        detalles: {
          create:
            data.detalles?.map((d) => ({
              id: randomUUID(),
              servicioId: d.servicioId,
              precioUnitario: d.precioUnitario,
              cantidad: d.cantidad,
              observacion: d.observacion,
            })) ?? [],
        },
      },
      include: {
        paciente: true,
        detalles: {
          include: {
            servicio: true,
          },
        },
      },
    });

    revalidatePath("/cotizaciones");
    revalidatePath(`/cotizaciones/${id}/edit`);
    revalidatePath(`/pacientes/${cotizacion.pacienteId}/perfil`);

    return {
      success: true,
      data: {
        id: cotizacion.id,
        pacienteId: cotizacion.pacienteId,
        pacienteNombre: `${cotizacion.paciente.nombre} ${cotizacion.paciente.apellido}`,
        fecha: cotizacion.fecha,
        estado: cotizacion.estado,
        total: Number(cotizacion.total),
        observacion: cotizacion.observacion,
        detalles: cotizacion.detalles.map((d) => ({
          id: d.id,
          cotizacionId: d.cotizacionId,
          servicioId: d.servicioId,
          servicioNombre: d.servicio.nombre,
          precioUnitario: Number(d.precioUnitario),
          cantidad: d.cantidad,
          observacion: d.observacion,
        })),
      },
    };
  } catch (error) {
    console.error(`Error al actualizar cotización con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Error desconocido al actualizar cotización",
    };
  }
}

/**
 * Elimina una cotización
 */
export async function deleteCotizacion(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!id) {
      return { success: false, error: "ID de la cotización es requerido" };
    }

    await prisma.cotizacion.deleteMany({
      where: await tenantWhere<Prisma.CotizacionWhereInput>({ id }),
    });

    revalidatePath("/cotizaciones");

    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar cotización con ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Error desconocido al eliminar cotización",
    };
  }
}

/**
 * Actualiza el estado de una cotización
 */
export async function updateEstadoCotizacion(
  id: string,
  estado: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const existing = await prisma.cotizacion.findFirst({ where: await tenantWhere<Prisma.CotizacionWhereInput>({ id }) });
    if (!existing) return { success: false, error: "Cotización no encontrada en la clínica" };

    await prisma.cotizacion.update({
      where: { id: existing.id },
      data: { estado },
    });

    revalidatePath("/cotizaciones");
    revalidatePath(`/cotizaciones/${id}/edit`);

    return { success: true };
  } catch (error) {
    console.error(`Error al actualizar estado de cotización ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido" };
  }
}

/**
 * Obtiene los servicios activos para el select
 */
export async function getServiciosActivos(): Promise<
  { id: string; nombre: string; precioBase: number }[]
> {
  try {
    const servicios = await prisma.servicio.findMany({
      where: await tenantWhere<Prisma.ServicioWhereInput>({ activo: true }),
      select: {
        id: true,
        nombre: true,
        precioBase: true,
      },
      orderBy: { nombre: "asc" },
    });

    return servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      precioBase: Number(s.precioBase),
    }));
  } catch (error) {
    console.error("Error al obtener servicios activos:", error);
    return [];
  }
}
