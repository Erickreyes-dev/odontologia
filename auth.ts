/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { Prisma } from '@/lib/generated/prisma';
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { TSchemaResetPassword, schemaResetPassword } from "./app/(public)/reset-password/schema";
import { schemaSignIn, TSchemaSignIn } from './lib/shemas';
import { prisma } from './lib/prisma';

const key = new TextEncoder().encode(process.env.AUTH_SECRET!);

export interface UsuarioSesion extends JWTPayload {
  IdUser: string;
  User: string;
  Rol: string;
  IdRol: string;
  IdEmpleado: string | null;
  Permiso: string[];
  DebeCambiar: boolean;
  Puesto: string;
  PuestoId: string;
  TenantId: string;
  TenantSlug: string;
  TenantNombre: string;
}

export async function encrypt(payload: UsuarioSesion) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("6h")
    .sign(key);
}

export const decrypt = async (token: string): Promise<UsuarioSesion | null> => {
  try {
    const { payload } = await jwtVerify<JWTPayload>(token, key, { algorithms: ["HS256"] });
    return {
      IdUser: payload.IdUser as string,
      User: payload.User as string,
      Rol: payload.Rol as string,
      IdRol: payload.IdRol as string,
      IdEmpleado: (payload.IdEmpleado as string | null) ?? null,
      Permiso: (payload.Permiso as string[]) || [],
      DebeCambiar: payload.DebeCambiar === true || payload.DebeCambiar === "True",
      Puesto: payload.Puesto as string,
      PuestoId: payload.PuestoId as string,
      TenantId: payload.TenantId as string,
      TenantSlug: payload.TenantSlug as string,
      TenantNombre: payload.TenantNombre as string,
      iss: payload.iss as string,
      aud: payload.aud as string,
    };
  } catch (err: any) {
    console.error("Error al decodificar token:", err.name === "JWTExpired" ? "Token expirado" : err);
    return null;
  }
};

export interface LoginResult {
  success?: string;
  error?: string;
  redirect?: string;
}

const setSessionCookie = (token: string) => {
  const expires = new Date(Date.now() + 6 * 60 * 60 * 1000);
  cookies().set("session", token, { expires, httpOnly: true, path: "/" });
};

export const getSession = async (): Promise<UsuarioSesion | null> => {
  const token = cookies().get("session")?.value;
  return token ? decrypt(token) : null;
};

export const getSessionPermisos = async (): Promise<string[] | null> => {
  const sess = await getSession();
  return sess?.Permiso || null;
};

export const signOut = async () => {
  cookies().delete("session");
};

export const login = async (credentials: TSchemaSignIn, redirect: string): Promise<LoginResult> => {
  const parsed = schemaSignIn.safeParse(credentials);
  if (!parsed.success) return { error: "Datos de acceso inválidos" };

  const { tenantSlug, usuario, contrasena } = parsed.data;
  const result = await authenticateDB(tenantSlug, usuario, contrasena);
  if (!result.token) return { error: result.error ?? "Clínica, usuario o contraseña inválidos" };

  setSessionCookie(result.token);
  return { success: "Login OK", redirect };
};

export const resetPassword = async (credentials: TSchemaResetPassword, username: string): Promise<LoginResult> => {
  const parsed = schemaResetPassword.safeParse(credentials);
  if (!parsed.success) return { error: "Error al cambiar la contraseña" };

  const session = await getSession();
  if (!session) return { error: "Sesión no válida" };

  const token = await changePassword(session.TenantId, username, parsed.data.confirmar);
  if (!token) return { error: "Error al cambiar la contraseña" };

  setSessionCookie(token);
  return { success: "Contraseña cambiada con éxito" };
};

const usuarioWithRolArgs = Prisma.validator<Prisma.UsuariosDefaultArgs>()({
  include: {
    rol: { include: { permisos: { include: { permiso: true } } } },
    Empleados: { include: { Puesto: true } },
    tenant: true,
  },
});
type UsuarioConRol = Prisma.UsuariosGetPayload<typeof usuarioWithRolArgs>;

async function authenticateDB(
  tenantSlug: string,
  username: string,
  password: string
): Promise<{ token: string | null; error?: string }> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return { token: null, error: "Clínica, usuario o contraseña inválidos" };
    }

    if (!tenant.activo) {
      return { token: null, error: "Este tenant está inhabilitado. Contacte al administrador del sistema." };
    }

    const user: UsuarioConRol | null = await prisma.usuarios.findFirst({
      where: { usuario: username, tenantId: tenant.id, activo: true },
      include: usuarioWithRolArgs.include,
    });
    if (!user || !user.tenant || !user.tenantId || !(await bcrypt.compare(password, user.contrasena))) {
      return { token: null, error: "Clínica, usuario o contraseña inválidos" };
    }

    const permisos = user.rol.permisos.map(rp => rp.permiso.nombre);

    const payload: UsuarioSesion = {
      IdUser: user.id,
      User: user.usuario,
      Rol: user.rol.nombre,
      IdRol: user.rol_id,
      IdEmpleado: user.empleado_id ?? null,
      Permiso: permisos,
      DebeCambiar: user.DebeCambiarPassword!,
      Puesto: user.Empleados?.Puesto?.Nombre ?? "",
      PuestoId: user.Empleados?.puesto_id ?? "",
      TenantId: user.tenantId ?? "",
      TenantSlug: user.tenant?.slug ?? "",
      TenantNombre: user.tenant?.nombre ?? "",
      iss: "odontologia-saas",
      aud: "odontologia-clients",
    };

    return { token: await encrypt(payload) };
  } catch (err) {
    console.error("Error en authenticateDB:", err);
    return { token: null, error: "No se pudo iniciar sesión" };
  }
}

async function changePassword(tenantId: string, username: string, newPassword: string): Promise<string | null> {
  try {
    const user = await prisma.usuarios.findFirst({
      where: { usuario: username, tenantId },
      include: usuarioWithRolArgs.include,
    });
    if (!user || !user.tenant || !user.tenantId) return null;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.usuarios.update({
      where: { id: user.id },
      data: { contrasena: hashedPassword, DebeCambiarPassword: false },
      include: usuarioWithRolArgs.include,
    });

    const permisos = updated.rol.permisos.map(rp => rp.permiso.nombre);
    const payload: UsuarioSesion = {
      IdUser: updated.id,
      User: updated.usuario,
      Rol: updated.rol.nombre,
      IdRol: updated.rol_id,
      IdEmpleado: updated.empleado_id ?? null,
      Permiso: permisos,
      DebeCambiar: updated.DebeCambiarPassword!,
      Puesto: updated.Empleados?.Puesto?.Nombre ?? "",
      PuestoId: updated.Empleados?.puesto_id ?? "",
      TenantId: updated.tenantId ?? "",
      TenantSlug: updated.tenant?.slug ?? "",
      TenantNombre: updated.tenant?.nombre ?? "",
      iss: "odontologia-saas",
      aud: "odontologia-clients",
    };

    return encrypt(payload);
  } catch (err) {
    console.error("Error en changePassword:", err);
    return null;
  }
}
