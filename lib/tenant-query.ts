import { getTenantContext } from "@/lib/tenant";

export async function tenantWhere<T extends Record<string, unknown>>(where?: T): Promise<T & { tenantId: string }> {
  const { tenantId } = await getTenantContext();
  return {
    ...(where ?? ({} as T)),
    tenantId,
  } as T & { tenantId: string };
}

export async function withTenantData<T extends Record<string, unknown>>(data: T): Promise<T & { tenantId: string }> {
  const { tenantId } = await getTenantContext();
  return {
    ...data,
    tenantId,
  };
}
