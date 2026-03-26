"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export async function getQuickActionCatalogs() {
  const session = await getSession();
  if (!session?.TenantId) return null;

  const [pacientes, medicos, consultorios] = await Promise.all([
    prisma.paciente.findMany({ where: { tenantId: session.TenantId, activo: true }, select: { id: true, nombre: true, apellido: true }, take: 50 }),
    prisma.medico.findMany({ where: { tenantId: session.TenantId, activo: true }, select: { idEmpleado: true, empleado: { select: { nombre: true, apellido: true } } }, take: 50 }),
    prisma.consultorio.findMany({ where: { tenantId: session.TenantId, activo: true }, select: { id: true, nombre: true }, take: 50 }),
  ]);

  return { pacientes, medicos, consultorios };
}

export async function quickCreatePaciente(input: { nombre: string; apellido: string; identidad: string; telefono?: string }) {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  await prisma.paciente.create({
    data: {
      id: randomUUID(),
      tenantId: session.TenantId,
      nombre: input.nombre,
      apellido: input.apellido,
      identidad: input.identidad,
      telefono: input.telefono || null,
      activo: true,
    },
  });

  revalidatePath("/pacientes");
  return { success: true as const };
}

export async function quickCreateCita(input: { pacienteId: string; medicoId: string; consultorioId: string; fechaHora: string; motivo?: string }) {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  await prisma.cita.create({
    data: {
      id: randomUUID(),
      tenantId: session.TenantId,
      pacienteId: input.pacienteId,
      medicoId: input.medicoId,
      consultorioId: input.consultorioId,
      fechaHora: new Date(input.fechaHora),
      estado: "PENDIENTE",
      motivo: input.motivo || null,
    },
  });

  revalidatePath("/citas");
  return { success: true as const };
}

export async function quickCreateCotizacion(input: { pacienteId: string; total: number; observacion?: string }) {
  const session = await getSession();
  if (!session?.TenantId) return { success: false as const, error: "Sesión inválida" };

  await prisma.cotizacion.create({
    data: {
      id: randomUUID(),
      tenantId: session.TenantId,
      pacienteId: input.pacienteId,
      estado: "BORRADOR",
      total: input.total,
      observacion: input.observacion || null,
    },
  });

  revalidatePath("/cotizaciones");
  return { success: true as const };
}
