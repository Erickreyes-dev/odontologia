"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
  CreateOrdenCobroSchema,
  type CreateOrdenCobroInput,
  type OrdenCobroWithRelations,
} from "./schema";

export async function createOrdenCobro(
  data: CreateOrdenCobroInput
): Promise<{ success: true; data: OrdenCobroWithRelations } | { success: false; error: string }> {
  try {
    const validated = CreateOrdenCobroSchema.parse(data);

    const orden = await prisma.ordenDeCobro.create({
      data: {
        id: randomUUID(),
        pacienteId: validated.pacienteId,
        planTratamientoId: validated.planTratamientoId || null,
        financiamientoId: validated.financiamientoId || null,
        consultaId: validated.consultaId || null,
        seguimientoId: validated.seguimientoId || null,
        monto: validated.monto,
        concepto: validated.concepto,
        estado: "PENDIENTE",
      },
      include: {
        paciente: true,
        planTratamiento: true,
        financiamiento: true,
        consulta: true,
        seguimiento: true,
      },
    });

    revalidatePath("/ordenes-cobro");
    revalidatePath(`/pacientes/${validated.pacienteId}/perfil`);

    return { success: true, data: mapOrdenToWithRelations(orden) };
  } catch (error) {
    console.error("Error al crear orden de cobro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear orden de cobro",
    };
  }
}

export async function getOrdenesCobro(): Promise<OrdenCobroWithRelations[]> {
  try {
    const records = await prisma.ordenDeCobro.findMany({
      include: {
        paciente: true,
        planTratamiento: true,
        financiamiento: true,
        consulta: true,
        seguimiento: true,
      },
      orderBy: { fechaEmision: "desc" },
    });

    return records.map(mapOrdenToWithRelations);
  } catch (error) {
    console.error("Error al obtener ordenes de cobro:", error);
    return [];
  }
}

export async function getOrdenesCobroPendientes(): Promise<OrdenCobroWithRelations[]> {
  try {
    const records = await prisma.ordenDeCobro.findMany({
      where: { estado: "PENDIENTE" },
      include: {
        paciente: true,
        planTratamiento: true,
        financiamiento: true,
        consulta: true,
        seguimiento: true,
      },
      orderBy: { fechaEmision: "desc" },
    });

    return records.map(mapOrdenToWithRelations);
  } catch (error) {
    console.error("Error al obtener ordenes pendientes:", error);
    return [];
  }
}

export async function anularOrdenCobro(
  ordenId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.ordenDeCobro.update({
      where: { id: ordenId },
      data: { estado: "ANULADA" },
    });
    revalidatePath("/ordenes-cobro");
    return { success: true };
  } catch (error) {
    console.error("Error al anular orden:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al anular orden",
    };
  }
}

function mapOrdenToWithRelations(r: {
  id: string;
  pacienteId: string;
  planTratamientoId: string | null;
  financiamientoId: string | null;
  consultaId: string | null;
  seguimientoId: string | null;
  monto: unknown;
  concepto: string;
  estado: string;
  fechaEmision: Date;
  fechaPago: Date | null;
  paciente?: { nombre: string; apellido: string } | null;
  planTratamiento?: { nombre: string } | null;
  financiamiento?: { id: string } | null;
  consulta?: { id: string } | null;
  seguimiento?: { id: string } | null;
}): OrdenCobroWithRelations {
  return {
    id: r.id,
    pacienteId: r.pacienteId,
    planTratamientoId: r.planTratamientoId,
    financiamientoId: r.financiamientoId,
    consultaId: r.consultaId,
    seguimientoId: r.seguimientoId,
    monto: Number(r.monto),
    concepto: r.concepto,
    estado: r.estado,
    fechaEmision: r.fechaEmision,
    fechaPago: r.fechaPago,
    pacienteNombre: r.paciente
      ? `${r.paciente.nombre} ${r.paciente.apellido}`
      : undefined,
    planRef: r.planTratamiento?.nombre,
    financiamientoRef: r.financiamiento ? `Fin. #${r.financiamiento.id.slice(0, 8)}` : undefined,
    consultaRef: r.consulta ? `Consulta #${r.consulta.id.slice(0, 8)}` : undefined,
    seguimientoRef: r.seguimiento ? `Seguimiento #${r.seguimiento.id.slice(0, 8)}` : undefined,
  };
}
