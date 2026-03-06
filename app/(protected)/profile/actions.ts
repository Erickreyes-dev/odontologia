"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Employee } from "./type";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere } from "@/lib/tenant-query";
import { revalidatePath } from "next/cache";

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
          select: { contactoCorreo: true, telefono: true, logoBase64: true },
        })
      : null;

    const canEditTenantContact = session.Permiso?.includes("editar_tenant") === true;

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
        tenantLogoBase64: tenant?.logoBase64 ?? null,
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
      tenantLogoBase64: tenant?.logoBase64 ?? null,
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
  telefono?: string | null;
  correo?: string | null;
  logoBase64?: string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();

    if (!session?.TenantId || !session.Permiso?.includes("editar_tenant")) {
      return { success: false, error: "No tiene permisos para editar el contacto del tenant" };
    }

    const telefonoRaw = input.telefono?.trim() ?? "";
    const correoRaw = input.correo?.trim().toLowerCase() ?? "";
    const logoBase64 = input.logoBase64?.trim() || null;

    if (telefonoRaw.length > 20) {
      return { success: false, error: "El teléfono debe tener máximo 20 caracteres" };
    }

    if (correoRaw.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (correoRaw.length > 150 || !emailRegex.test(correoRaw)) {
        return { success: false, error: "Ingrese un correo válido con máximo 150 caracteres" };
      }
    }

    if (logoBase64 && logoBase64.length > 2_800_000) {
      return { success: false, error: "El logo es demasiado grande (máximo aproximado 2 MB)" };
    }

    await prisma.tenant.update({
      where: { id: session.TenantId },
      data: {
        telefono: telefonoRaw || null,
        contactoCorreo: correoRaw || null,
        logoBase64,
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
