// libs/prisma.ts
import { headers } from "next/headers";
import { getSession } from "@/auth";
import { Prisma, PrismaClient } from "@/lib/generated/prisma";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  auditPrisma?: PrismaClient;
};

const WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

const SENSITIVE_KEYS = new Set(["contrasena", "password", "token", "secret", "authorization"]);

const ACTION_BY_OPERATION: Record<string, string> = {
  create: "CREAR",
  createMany: "CREAR",
  update: "MODIFICAR",
  updateMany: "MODIFICAR",
  upsert: "MODIFICAR",
  delete: "ELIMINAR",
  deleteMany: "ELIMINAR",
};

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTADO]" : redactSensitive(item),
    ])
  );
}

function normalize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(redactSensitive(value))) as Prisma.InputJsonValue;
}

function diffChanges(before: Record<string, unknown> | null | undefined, after: Record<string, unknown> | null | undefined) {
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

function delegateName(model: string) {
  return `${model.charAt(0).toLowerCase()}${model.slice(1)}`;
}

function getRecordId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const id = (value as { id?: unknown; Id?: unknown }).id ?? (value as { Id?: unknown }).Id;
  return typeof id === "string" ? id : null;
}

function getTenantIdFromValue(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { tenantId?: unknown; id?: unknown };
  if (typeof record.tenantId === "string") return record.tenantId;
  return null;
}

async function getRequestMetadata() {
  try {
    const requestHeaders = headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = requestHeaders.get("x-real-ip")?.trim();
    return {
      ip: forwardedFor || realIp || null,
      userAgent: requestHeaders.get("user-agent")?.slice(0, 255) || null,
    };
  } catch {
    return { ip: null, userAgent: null };
  }
}

async function getCurrentSession() {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

async function findPreviousValue(model: string, operation: string, args: unknown) {
  if (!["update", "delete", "upsert"].includes(operation)) return null;
  const where = (args as { where?: unknown })?.where;
  if (!where) return null;

  const delegate = (auditPrisma as unknown as Record<string, { findFirst?: (input: unknown) => Promise<unknown> }>)[delegateName(model)];
  if (!delegate?.findFirst) return null;

  try {
    return await delegate.findFirst({ where });
  } catch {
    return null;
  }
}

async function writeAuditLog({
  model,
  operation,
  args,
  before,
  result,
}: {
  model: string;
  operation: string;
  args: unknown;
  before: unknown;
  result: unknown;
}) {
  if (model === "AuditLog" || !WRITE_OPERATIONS.has(operation)) return;

  const session = await getCurrentSession();
  const resultArray = Array.isArray(result) ? result : null;
  const firstResult = resultArray?.[0] ?? result;
  const data = (args as { data?: unknown })?.data;
  const tenantId = session?.TenantId || getTenantIdFromValue(firstResult) || getTenantIdFromValue(data) || null;
  if (!tenantId) return;

  const action = ACTION_BY_OPERATION[operation] ?? "MODIFICAR";
  const entidadId = getRecordId(firstResult) ?? getRecordId((args as { where?: unknown })?.where);
  const affectedCount = typeof (result as { count?: unknown })?.count === "number" ? (result as { count: number }).count : undefined;
  const requestMetadata = await getRequestMetadata();
  const normalizedBefore = normalize(before);
  const normalizedAfter = normalize(result);

  await auditPrisma.auditLog.create({
    data: {
      tenantId,
      usuarioId: session?.IdUser || null,
      usuarioNombre: session?.User || null,
      accion: action,
      entidad: model,
      entidadId,
      resumen: `${action} en ${model}${affectedCount !== undefined ? ` (${affectedCount} registro${affectedCount === 1 ? "" : "s"})` : ""}`,
      detalle: `Registro automático de reportería para la operación ${operation} del módulo ${model}.`,
      valoresAntes: normalizedBefore,
      valoresDespues: normalizedAfter,
      cambios: normalize(diffChanges(before as Record<string, unknown>, result as Record<string, unknown>)),
      metadata: normalize({ operation, args }),
      ip: requestMetadata.ip,
      userAgent: requestMetadata.userAgent,
    },
  });
}

const auditPrisma = globalForPrisma.auditPrisma ?? new PrismaClient();

const createPrismaClient = () =>
  new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !WRITE_OPERATIONS.has(operation)) {
            return query(args);
          }

          const before = await findPreviousValue(model, operation, args);
          const result = await query(args);

          await writeAuditLog({ model, operation, args, before, result });

          return result;
        },
      },
    },
  }) as PrismaClient;

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.auditPrisma = auditPrisma;
}
