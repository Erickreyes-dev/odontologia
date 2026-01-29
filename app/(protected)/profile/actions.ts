"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Employee } from "./type"; // Asegúrate de que este tipo tenga los campos correctos

/**
 * Obtiene el perfil del empleado autenticado.
 */
export async function getProfile(): Promise<Employee | null> {
  try {
    const session = await getSession();
    const idEmpleado = session?.IdEmpleado;
    if (!idEmpleado) throw new Error("Empleado no autenticado");

    const e = await prisma.empleados.findFirst({
      where: { id: idEmpleado },
      include: {
        Usuarios: true,
        Puesto: true,
      },
    });

    if (!e) throw new Error("Empleado no encontrado");

    return {
      id: e.id,
      identidad: e.identidad,
      fechaIngreso: e.fechaIngreso  ?? new Date(0) ,
      nombre: e.nombre,
      apellido: e.apellido,
      correo: e.correo,
      fechaNacimiento: e.FechaNacimiento ?? new Date(0),
      vacaciones: e.Vacaciones,
      genero: e.genero || "No especificado",
      activo: e.activo,
      usuario: e.Usuarios?.usuario ?? "Sin usuario",
      usuario_id: e.Usuarios?.id ?? "",
      
      puesto_id: e.puesto_id,
      puesto: e.Puesto?.Nombre ?? "Sin Puesto",
      telefono: e.telefono || "No especificado",
      createAt: e.createAt ?? new Date(0),
      updateAt: e.updateAt ?? new Date(0),
    };
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return null;
  }
}

