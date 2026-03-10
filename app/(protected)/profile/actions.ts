"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Employee } from "./type";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere } from "@/lib/tenant-query";

export async function getProfile(): Promise<Employee | null> {
  try {
    const session = await getSession();
    if (!session?.IdUser) throw new Error("Usuario no autenticado");

    const usuario = await prisma.usuarios.findFirst({
      where: await tenantWhere<Prisma.UsuariosWhereInput>({ id: session.IdUser }),
      include: {
        Empleados: {
          include: {
            Puesto: true,
          },
        },
      },
    });

    if (!usuario) throw new Error("Usuario no encontrado");

    if (usuario.Empleados) {
      const e = usuario.Empleados;
      return {
        id: e.id,
        identidad: e.identidad,
        fechaIngreso: e.fechaIngreso ?? null,
        nombre: e.nombre,
        apellido: e.apellido,
        correo: e.correo,
        fechaNacimiento: e.FechaNacimiento ?? null,
        vacaciones: e.Vacaciones,
        genero: e.genero || "No especificado",
        activo: e.activo,
        usuario: usuario.usuario,
        usuario_id: usuario.id,
        puesto_id: e.puesto_id,
        puesto: e.Puesto?.Nombre ?? "Sin Puesto",
        telefono: e.telefono || "No especificado",
        createAt: e.createAt ?? new Date(0),
        updateAt: e.updateAt ?? new Date(0),
      };
    }

    return {
      id: usuario.id,
      identidad: "No aplica",
      fechaIngreso: null,
      nombre: session.User,
      apellido: "",
      correo: "No especificado",
      fechaNacimiento: null,
      vacaciones: 0,
      genero: "No especificado",
      activo: usuario.activo,
      usuario: usuario.usuario,
      usuario_id: usuario.id,
      puesto_id: "",
      puesto: session.Rol || "Sin puesto",
      telefono: "No especificado",
      createAt: usuario.createAt ?? new Date(0),
      updateAt: usuario.updateAt ?? new Date(0),
    };
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return null;
  }
}
