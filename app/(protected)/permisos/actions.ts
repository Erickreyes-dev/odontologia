"use server";


import { prisma } from "@/lib/prisma";

import { PermisosRol } from "../roles/schema";
import { Permiso as PermisoDTO } from "./schema";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere } from "@/lib/tenant-query";
/**
 * Obtiene los permisos y los transforma a DTO
 */
export async function getPermisos(): Promise<PermisoDTO[]> {
  try {
    const permisos = await prisma.permiso.findMany({
      where: await tenantWhere<Prisma.PermisoWhereInput>({ activo: true })
    });

    // Mapear al DTO para exponer sólo los campos necesarios
    return permisos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      activo: p.activo,

    }));
  } catch (error) {
    console.error("Error al obtener los permisos:", error);
    return [];
  }
}
export async function getPermisosForRoles(): Promise<PermisosRol[]> {
  try {
    const permisos = await prisma.permiso.findMany({
      where: await tenantWhere<Prisma.PermisoWhereInput>({ activo: true })
    });

    // Mapear al DTO para exponer sólo los campos necesarios
    return permisos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      activo: p.activo,
    }));
  } catch (error) {
    console.error("Error al obtener los permisos:", error);
    return [];
  }
}
