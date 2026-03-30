import { getSession } from "@/auth";

export async function requireTenantPermission(permission: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Sesión no válida");
  }

  if (!session.Permiso.includes(permission)) {
    throw new Error(`No tiene permisos para ${permission}`);
  }

  return session;
}

export async function requireAnyTenantPermission(permissions: string[]) {
  const session = await getSession();
  if (!session) {
    throw new Error("Sesión no válida");
  }

  const hasAny = permissions.some((permission) => session.Permiso.includes(permission));
  if (!hasAny) {
    throw new Error("No tiene permisos suficientes para esta acción");
  }

  return session;
}
