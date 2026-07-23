"use server";

import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant-query";

export type AuditLogListItem = {
  id: string;
  fecha: Date;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  resumen: string;
  detalle: string | null;
  cambios: unknown;
  valoresAntes: unknown;
  valoresDespues: unknown;
  ip: string | null;
};

export async function getAuditLogs(filters?: { accion?: string; entidad?: string; entidadId?: string; usuario?: string; ip?: string; texto?: string; desde?: Date; hasta?: Date }): Promise<AuditLogListItem[]> {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters?.accion) where.accion = filters.accion;
  if (filters?.entidad) where.entidad = { contains: filters.entidad };
  if (filters?.entidadId) where.entidadId = { contains: filters.entidadId };
  if (filters?.usuario) where.usuarioNombre = { contains: filters.usuario };
  if (filters?.ip) where.ip = { contains: filters.ip };
  if (filters?.texto) {
    where.OR = [
      { resumen: { contains: filters.texto } },
      { detalle: { contains: filters.texto } },
      { entidad: { contains: filters.texto } },
      { entidadId: { contains: filters.texto } },
      { usuarioNombre: { contains: filters.texto } },
    ];
  }
  if (filters?.desde || filters?.hasta) {
    where.createAt = {
      ...(filters.desde ? { gte: filters.desde } : {}),
      ...(filters.hasta ? { lte: filters.hasta } : {}),
    };
  }

  const logs = await prisma.auditLog.findMany({
    where: await tenantWhere<Prisma.AuditLogWhereInput>(where),
    orderBy: { createAt: "desc" },
    take: 200,
  });

  return logs.map((log) => ({
    id: log.id,
    fecha: log.createAt,
    usuario: log.usuarioNombre || "Usuario no disponible",
    accion: log.accion,
    entidad: log.entidad,
    entidadId: log.entidadId,
    resumen: log.resumen,
    detalle: log.detalle,
    cambios: log.cambios,
    valoresAntes: log.valoresAntes,
    valoresDespues: log.valoresDespues,
    ip: log.ip,
  }));
}
