import { headers } from "next/headers";
import { getSession } from "@/auth";
import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

export type AuditAction = "CREAR" | "MODIFICAR" | "ELIMINAR";

type AuditInput = {
  accion: AuditAction;
  entidad: string;
  entidadId?: string | null;
  resumen: string;
  detalle?: string | null;
  valoresAntes?: unknown;
  valoresDespues?: unknown;
  metadata?: unknown;
};

function normalize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function diffChanges(before: Record<string, unknown> | null | undefined, after: Record<string, unknown> | null | undefined) {
  if (!before || !after) return undefined;
  const changes: Record<string, { antes: unknown; despues: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const previous = normalize(before[key]);
    const next = normalize(after[key]);
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      changes[key] = { antes: previous, despues: next };
    }
  }
  return Object.keys(changes).length ? changes : undefined;
}

export async function createAuditLog(input: AuditInput, tx: Prisma.TransactionClient = prisma) {
  const session = await getSession();
  if (!session?.TenantId) return null;

  const requestHeaders = headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();

  return tx.auditLog.create({
    data: {
      tenantId: session.TenantId,
      usuarioId: session.IdUser || null,
      usuarioNombre: session.User || null,
      accion: input.accion,
      entidad: input.entidad,
      entidadId: input.entidadId || null,
      resumen: input.resumen,
      detalle: input.detalle || null,
      valoresAntes: normalize(input.valoresAntes),
      valoresDespues: normalize(input.valoresDespues),
      cambios: normalize(diffChanges(input.valoresAntes as Record<string, unknown>, input.valoresDespues as Record<string, unknown>)),
      metadata: normalize(input.metadata),
      ip: forwardedFor || realIp || null,
      userAgent: requestHeaders.get("user-agent")?.slice(0, 255) || null,
    },
  });
}
