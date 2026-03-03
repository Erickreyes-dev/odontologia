"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Employee } from "./type";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere } from "@/lib/tenant-query";
import { revalidatePath } from "next/cache";

/**
 * Obtiene el perfil del usuario autenticado.
 * Soporta usuarios con empleado asociado y usuarios admins globales sin empleado.
 */
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

    const tenant = session.TenantId
      ? await prisma.tenant.findUnique({
          where: { id: session.TenantId },
          select: { contactoCorreo: true, telefono: true },
        })
      : null;

    const canEditTenantContact = session.Rol === "Administrador";

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
        tenantCorreo: tenant?.contactoCorreo ?? null,
        tenantTelefono: tenant?.telefono ?? null,
        canEditTenantContact,
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
      tenantCorreo: tenant?.contactoCorreo ?? null,
      tenantTelefono: tenant?.telefono ?? null,
      canEditTenantContact,
      createAt: usuario.createAt ?? new Date(0),
      updateAt: usuario.updateAt ?? new Date(0),
    };
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return null;
  }
}

export async function updateTenantContactInfo(input: {
  telefono: string;
  correo: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();

    if (!session?.TenantId || session.Rol !== "AdministradorTenant") {
      return { success: false, error: "No tiene permisos para editar el contacto del tenant" };
    }

    const telefono = input.telefono.trim();
    const correo = input.correo.trim().toLowerCase();

    if (!telefono || telefono.length > 20) {
      return { success: false, error: "El teléfono es requerido y debe tener máximo 20 caracteres" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || correo.length > 150 || !emailRegex.test(correo)) {
      return { success: false, error: "Ingrese un correo válido con máximo 150 caracteres" };
    }

    await prisma.tenant.update({
      where: { id: session.TenantId },
      data: {
        telefono,
        contactoCorreo: correo,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo actualizar la información de contacto",
    };
  }
}
