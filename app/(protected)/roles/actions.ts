
"use server";
import { prisma } from "@/lib/prisma"; // Asegúrate de importar correctamente tu cliente de Prisma
import { randomUUID } from "crypto";
import { PermisosRol, Rol as RolDTO } from "./schema";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";

export async function getRolesPermisos(): Promise<RolDTO[]> {
  try {
    const roles = await prisma.rol.findMany({
      where: await tenantWhere<Prisma.RolWhereInput>(),
      include: {
        permisos: {
          include: {
            permiso: true,
          },
        },
      },
    });

    // Mapear al DTO
    return roles.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      activo: r.activo,
      permisos: r.permisos.map((rp): PermisosRol => ({
        id: rp.permiso.id,
        nombre: rp.permiso.nombre,
      })),
    }));
  } catch (error) {
    console.error("Error al obtener los roles y permisos:", error);
    return [];
  }
}

export async function getRolesPermisosActivos(): Promise<RolDTO[]> {
  try {
    const roles = await prisma.rol.findMany({
      where: await tenantWhere<Prisma.RolWhereInput>(),
      include: {
        permisos: {
          include: {
            permiso: true,
          },
        },
      },
    });

    // Mapear al DTO
    return roles.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      activo: r.activo,
      permisos: r.permisos.map((rp): PermisosRol => ({
        id: rp.permiso.id,
        nombre: rp.permiso.nombre,
      })),
    }));
  } catch (error) {
    console.error("Error al obtener los roles y permisos:", error);
    return [];
  }
}

export async function putRol({ rol }: { rol: RolDTO }): Promise<RolDTO | null> {
  // Preparamos los nuevos permisos para crear las filas intermedias
  const permisosCreate = rol.permisos.map((p: PermisosRol) => ({
    permiso: { connect: { id: p.id } },
  }));

  try {
    const existing = await prisma.rol.findFirst({ where: await tenantWhere<Prisma.RolWhereInput>({ id: rol.id! }) });
    if (!existing) return null;

    const updated = await prisma.rol.update({
      where: { id: existing.id },
      data: {
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        activo: rol.activo ?? true,
        permisos: {
          // 1) Eliminamos todas las filas RolPermiso existentes
          deleteMany: {},
          // 2) Creamos las nuevas relaciones
          create: permisosCreate,
        },
      },
      include: {
        permisos: {
          include: {
            permiso: true,
          },
        },
      },
    });

    // Mapear la respuesta de Prisma a tu DTO
    return {
      id: updated.id,
      nombre: updated.nombre,
      descripcion: updated.descripcion,
      activo: updated.activo,
      permisos: updated.permisos.map((rp) => ({
        id: rp.permiso.id,
        nombre: rp.permiso.nombre,
      })),
    };
  } catch (error) {
    console.error("Error al actualizar el rol:", error);
    return null;
  }
}



export async function getRolPermisoById(id: string): Promise<RolDTO | null> {
  try {
    const rol = await prisma.rol.findFirst({
      where: await tenantWhere<Prisma.RolWhereInput>({ id }),
      include: {
        permisos: {
          include: {
            permiso: true,
          },
        },
      },
    });

    if (!rol) {
      return null;
    }

    return {
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      activo: rol.activo,
      permisos: rol.permisos.map((rp): PermisosRol => ({
        id: rp.permiso.id,
        nombre: rp.permiso.nombre,
      })),
    };
  } catch (error) {
    console.error("Error al obtener el rol por ID:", error);
    return null;
  }
}


export async function postRol({
  rol,
}: {
  rol: RolDTO;
}): Promise<RolDTO | null> {
  try {
    const created = await prisma.rol.create({
      data: await withTenantData({
        // Generamos un UUID para el rol
        id: randomUUID(),
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        activo: rol.activo ?? true,
        permisos: {
          create: rol.permisos.map((p: PermisosRol) => ({
            id: p.id,
            permiso: { connect: { id: p.id } },
          })),
        },
      }),
      include: {
        permisos: {
          include: {
            permiso: true,
          },
        },
      },
    });

    // Mapeamos a tu DTO RolDTO
    return {
      id: created.id,
      nombre: created.nombre,
      descripcion: created.descripcion,
      activo: created.activo,
      permisos: created.permisos.map((rp) => ({
        id: rp.permiso.id,
        nombre: rp.permiso.nombre,
      })),
    };
  } catch (error) {
    console.error("Error al crear el rol:", error);
    return null;
  }
}