"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Empleado } from "./schema"; // Asegúrate de que `EmployeeImportDto` contenga todos los campos importados del Excel
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";

/**
 * Obtiene todos los empleados con datos de puesto y jefe
 */
export async function getEmpleados(): Promise<Empleado[]> {
  const records = await prisma.empleados.findMany({
    where: await tenantWhere<Prisma.EmpleadosWhereInput>(),
    include: {
      Usuarios: true,
      Puesto: true,
    },
  });

  return records.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    identidad: r.identidad,
    apellido: r.apellido,
    correo: r.correo,
    fechaNacimiento: r.FechaNacimiento ?? new Date(0),
    fechaIngreso: r.fechaIngreso ?? new Date(0),
    telefono: r.telefono ?? "",
    vacaciones: r.Vacaciones,
    genero: r.genero ?? "",
    activo: r.activo,
    usuario: r.Usuarios?.usuario ?? "Sin Usuario",
    puesto_id: r.puesto_id,
    puesto: r.Puesto.Nombre,
  }));
}

/**
 * Empleados sin usuario asignado
 */
export async function getEmpleadosSinUsuario(): Promise<Empleado[]> {
  const records = await prisma.empleados.findMany({
    where: await tenantWhere<Prisma.EmpleadosWhereInput>({ Usuarios: null }),
    include: { Puesto: true },
  });
  return records.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    correo: r.correo,
    fechaNacimiento: r.FechaNacimiento ?? new Date(0),
    fechaIngreso: r.fechaIngreso ?? new Date(0),
    identidad: r.identidad,
    telefono: r.telefono ?? "",
    vacaciones: r.Vacaciones,
    genero: r.genero ?? "",
    activo: r.activo,
    usuario: undefined,
    puesto_id: r.puesto_id,
    puesto: r.Puesto.Nombre,
  }));
}

/**
 * Obtener un empleado por ID
 */
export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  const r = await prisma.empleados.findFirst({
    where: await tenantWhere<Prisma.EmpleadosWhereInput>({ id }),
    include: {
      Puesto: true,
      Usuarios: true,
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    correo: r.correo,
    fechaNacimiento: r.FechaNacimiento ?? new Date(0),
    fechaIngreso: r.fechaIngreso ?? new Date(0),
    identidad: r.identidad,
    telefono: r.telefono ?? "",
    vacaciones: r.Vacaciones,
    genero: r.genero ?? "",
    activo: r.activo,
    usuario: r.Usuarios?.usuario ?? undefined,
    puesto_id: r.puesto_id,
    puesto: r.Puesto.Nombre,
  };
}

/**
 * Crea un nuevo empleado
 */
export async function createEmpleado(data: Empleado): Promise<Empleado> {
  const id = randomUUID();
  const r = await prisma.empleados.create({
    data: await withTenantData({
      id,
      nombre: data.nombre,
      apellido: data.apellido,
      correo: data.correo,
      FechaNacimiento: data.fechaNacimiento,
      fechaIngreso: data.fechaIngreso,
      identidad: data.identidad,
      telefono: data.telefono,
      Vacaciones: data.vacaciones ?? 0,
      genero: data.genero,
      activo: data.activo ?? true,
      puesto_id: data.puesto_id,
    }),
  });
  return getEmpleadoById(r.id) as Promise<Empleado>;
}

/**
 * Actualiza un empleado existente
 */
export async function updateEmpleado(
  id: string,
  data: Partial<Empleado>
): Promise<Empleado | null> {
  const existing = await prisma.empleados.findFirst({ where: await tenantWhere<Prisma.EmpleadosWhereInput>({ id }) });
  if (!existing) return null;

  const r = await prisma.empleados.update({
    where: { id: existing.id },
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      correo: data.correo,
      FechaNacimiento: data.fechaNacimiento,
      fechaIngreso: data.fechaIngreso,
      identidad: data.identidad,
      telefono: data.telefono,
      Vacaciones: data.vacaciones,
      genero: data.genero,
      activo: data.activo,
      puesto_id: data.puesto_id,
    },
  });
  return getEmpleadoById(r.id);
}

