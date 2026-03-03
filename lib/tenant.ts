import { cache } from "react";
import { getSession } from "@/auth";

export type TenantContext = {
  tenantId: string;
  tenantSlug: string;
};

export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const session = await getSession();

  if (!session?.TenantId || !session?.TenantSlug) {
    throw new Error("No hay tenant activo en la sesión");
  }

  return {
    tenantId: session.TenantId,
    tenantSlug: session.TenantSlug,
  };
});
