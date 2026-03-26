"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { TENANT_PERMISSIONS } from "@/lib/permission-catalog";
import { resolveCurrencyByCountry } from "@/lib/country-currency";
import { encrypt, type UsuarioSesion } from "@/auth";
import { cookies, headers } from "next/headers";
import { resolveTenantSlugFromHost } from "@/lib/tenant-host";
import { getSessionCookieDomain } from "@/lib/session-cookie";
import { isSubscriptionActive, resolveSubscriptionStatus } from "@/lib/subscription-status";

interface GoogleOnboardingInput {
  credential: string;
  consultorioNombre: string;
  teamSize: "1" | "2" | "3-5" | ">5";
  paisCodigo: string;
  packageId: string;
  periodoPlan: "mensual" | "trimestral" | "semestral" | "anual";
}

async function verifyGoogleCredential(credential: string) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo verificar el token de Google");
  const tokenInfo = await response.json();

  if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Token de Google inválido para esta aplicación");
  }

  if (tokenInfo.email_verified !== "true") {
    throw new Error("Tu cuenta de Google debe tener email verificado");
  }

  return {
    email: String(tokenInfo.email).toLowerCase(),
    name: String(tokenInfo.name ?? tokenInfo.email.split("@")[0]),
    sub: String(tokenInfo.sub),
  };
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

async function createSession(payload: UsuarioSesion) {
  const token = await encrypt(payload);
  const domain = getSessionCookieDomain();
  cookies().set("session", token, {
    expires: new Date(Date.now() + 6 * 60 * 60 * 1000),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(domain ? { domain } : {}),
  });
}

function usernameFromEmail(email: string) {
  return email.split("@")[0].slice(0, 50);
}

async function findGoogleUserByEmail(email: string) {
  return prisma.usuarios.findFirst({
    where: {
      correo: email,
      tenant: { authProvider: "google" },
      activo: true,
      tenantId: { not: null },
    },
    include: {
      rol: true,
      tenant: { include: { roles: true, permisos: true } },
    },
  });
}

async function resolveTenantSlugForGoogle() {
  const requestHeaders = headers();
  const slugFromHeader = requestHeaders.get("x-tenant-slug")?.trim().toLowerCase();
  if (slugFromHeader) return slugFromHeader;
  return resolveTenantSlugFromHost(requestHeaders.get("host"));
}

async function findUserForTenantGoogleLogin(email: string, tenantSlug?: string | null) {
  if (!tenantSlug) return null;

  return prisma.usuarios.findFirst({
    where: {
      tenant: { slug: tenantSlug, activo: true },
      activo: true,
      OR: [
        { correo: email },
        { Empleados: { correo: email } },
      ],
    },
    include: {
      rol: true,
      tenant: { include: { permisos: true } },
    },
  });
}

export async function registerTenantWithGoogle(input: GoogleOnboardingInput): Promise<{ success: true; tenantUrl: string; alreadyExists?: boolean } | { success: false; error: string }> {
  try {
    if (!input.credential) return { success: false, error: "Debes autenticar con Google para continuar" };

    const identity = await verifyGoogleCredential(input.credential);
    const existingGoogleUser = await findGoogleUserByEmail(identity.email);
    if (existingGoogleUser?.tenant && existingGoogleUser.tenantId) {
      const subscriptionStatus = resolveSubscriptionStatus({
        tenantActivo: existingGoogleUser.tenant.activo,
        trialEndsAt: existingGoogleUser.tenant.trialEndsAt,
        proximoPago: existingGoogleUser.tenant.proximoPago,
      });
      const payload: UsuarioSesion = {
        IdUser: existingGoogleUser.id,
        User: existingGoogleUser.usuario,
        Rol: existingGoogleUser.rol.nombre,
        IdRol: existingGoogleUser.rol_id,
        IdEmpleado: existingGoogleUser.empleado_id,
        Permiso: existingGoogleUser.tenant.permisos.map((p) => p.nombre),
        DebeCambiar: Boolean(existingGoogleUser.DebeCambiarPassword),
        Puesto: "",
        PuestoId: "",
        TenantId: existingGoogleUser.tenantId,
        TenantSlug: existingGoogleUser.tenant.slug,
        TenantNombre: existingGoogleUser.tenant.nombre,
        SuscripcionActiva: isSubscriptionActive(subscriptionStatus),
        SubscriptionStatus: subscriptionStatus,
        TenantActivo: Boolean(existingGoogleUser.tenant.activo),
        TrialEndsAt: existingGoogleUser.tenant.trialEndsAt?.toISOString() ?? null,
        ProximoPago: existingGoogleUser.tenant.proximoPago?.toISOString() ?? null,
        iss: "odontologia-saas",
        aud: "odontologia-clients",
      };

      await createSession(payload);
      return { success: true, tenantUrl: `https://${existingGoogleUser.tenant.slug}.medisoftcore.com`, alreadyExists: true };
    }
    if (!input.packageId) return { success: false, error: "Selecciona un paquete para continuar" };

    const selectedPackage = await prisma.paquete.findFirst({ where: { id: input.packageId, activo: true } });
    if (!selectedPackage) {
      return { success: false, error: "El paquete seleccionado ya no está disponible" };
    }
    const consultorioNombre = input.consultorioNombre.trim();
    if (consultorioNombre.length < 3) {
      return { success: false, error: "El nombre del consultorio es obligatorio" };
    }

    const slugBase = normalizeSlug(consultorioNombre);
    let slug = slugBase;
    let attempt = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${attempt}`;
      attempt += 1;
    }

    const currency = resolveCurrencyByCountry(input.paisCodigo);
    const tempPassword = await bcrypt.hash(`${identity.sub}-${Date.now()}`, 10);

    const result = await prisma.$transaction(async (tx) => {
      const trialConfigActivo = Boolean(selectedPackage.trialActivo);
      const trialConfigDias = Math.max(0, Number(selectedPackage.trialDias ?? 0));
      const trialEndsAt = trialConfigActivo && trialConfigDias > 0
        ? new Date(Date.now() + trialConfigDias * 24 * 60 * 60 * 1000)
        : null;

      const tenant = await tx.tenant.create({
        data: {
          id: randomUUID(),
          nombre: consultorioNombre,
          slug,
          plan: selectedPackage.nombre,
          paqueteId: selectedPackage.id,
          maxUsuarios: selectedPackage.maxUsuarios,
          periodoPlan: input.periodoPlan,
          proximoPago: trialEndsAt,
          contactoNombre: identity.name,
          contactoCorreo: identity.email,
          authProvider: "google",
          teamSize: input.teamSize,
          paisCodigo: input.paisCodigo,
          monedaCodigo: currency.currency,
          trialEndsAt,
          activo: true,
        },
      });

      const permisos = [] as { id: string; nombre: string }[];
      for (const permission of TENANT_PERMISSIONS) {
        const created = await tx.permiso.create({
          data: {
            id: randomUUID(),
            tenantId: tenant.id,
            nombre: permission.nombre,
            descripcion: permission.descripcion,
            activo: true,
          },
        });
        permisos.push({ id: created.id, nombre: created.nombre });
      }

      const adminRole = await tx.rol.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          nombre: "AdministradorTenant",
          descripcion: "Administrador principal del tenant",
          activo: true,
        },
      });

      for (const permiso of permisos) {
        await tx.rolPermiso.create({ data: { id: randomUUID(), rolId: adminRole.id, permisoId: permiso.id } });
      }

      const baseUser = usernameFromEmail(identity.email);
      let usuario = baseUser;
      let usernameAttempt = 1;
      while (await tx.usuarios.findUnique({ where: { tenantId_usuario: { tenantId: tenant.id, usuario } } })) {
        usuario = `${baseUser}${usernameAttempt}`.slice(0, 50);
        usernameAttempt += 1;
      }

      const user = await tx.usuarios.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          usuario,
          correo: identity.email,
          contrasena: tempPassword,
          empleado_id: null,
          rol_id: adminRole.id,
          activo: true,
          DebeCambiarPassword: false,
        },
      });

      return { tenant, user, adminRole, permisos };
    });

    const payload: UsuarioSesion = {
      IdUser: result.user.id,
      User: result.user.usuario,
      Rol: result.adminRole.nombre,
      IdRol: result.adminRole.id,
      IdEmpleado: null,
      Permiso: result.permisos.map((p) => p.nombre),
      DebeCambiar: false,
      Puesto: "",
      PuestoId: "",
      TenantId: result.tenant.id,
      TenantSlug: result.tenant.slug,
      TenantNombre: result.tenant.nombre,
      SuscripcionActiva: true,
      SubscriptionStatus: "vigente",
      TenantActivo: Boolean(result.tenant.activo),
      TrialEndsAt: result.tenant.trialEndsAt?.toISOString() ?? null,
      ProximoPago: result.tenant.proximoPago?.toISOString() ?? null,
      iss: "odontologia-saas",
      aud: "odontologia-clients",
    };

    await createSession(payload);

    return { success: true, tenantUrl: `https://${result.tenant.slug}.medisoftcore.com` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo completar el registro" };
  }
}

export async function loginGoogleExistingTenant(credential: string): Promise<{ success: true; exists: boolean; tenantUrl?: string } | { success: false; error: string }> {
  try {
    if (!credential) return { success: false, error: "Credencial inválida" };
    const identity = await verifyGoogleCredential(credential);
    const tenantSlug = await resolveTenantSlugForGoogle();
    const existingGoogleUser = await findUserForTenantGoogleLogin(identity.email, tenantSlug) ?? await findGoogleUserByEmail(identity.email);

    if (!existingGoogleUser?.tenant || !existingGoogleUser.tenantId) {
      return { success: true, exists: false };
    }

    const subscriptionStatus = resolveSubscriptionStatus({
      tenantActivo: existingGoogleUser.tenant.activo,
      trialEndsAt: existingGoogleUser.tenant.trialEndsAt,
      proximoPago: existingGoogleUser.tenant.proximoPago,
    });
    const payload: UsuarioSesion = {
      IdUser: existingGoogleUser.id,
      User: existingGoogleUser.usuario,
      Rol: existingGoogleUser.rol.nombre,
      IdRol: existingGoogleUser.rol_id,
      IdEmpleado: existingGoogleUser.empleado_id,
      Permiso: existingGoogleUser.tenant.permisos.map((p) => p.nombre),
      DebeCambiar: Boolean(existingGoogleUser.DebeCambiarPassword),
      Puesto: "",
      PuestoId: "",
      TenantId: existingGoogleUser.tenantId,
      TenantSlug: existingGoogleUser.tenant.slug,
      TenantNombre: existingGoogleUser.tenant.nombre,
      SuscripcionActiva: isSubscriptionActive(subscriptionStatus),
      SubscriptionStatus: subscriptionStatus,
      TenantActivo: Boolean(existingGoogleUser.tenant.activo),
      TrialEndsAt: existingGoogleUser.tenant.trialEndsAt?.toISOString() ?? null,
      ProximoPago: existingGoogleUser.tenant.proximoPago?.toISOString() ?? null,
      iss: "odontologia-saas",
      aud: "odontologia-clients",
    };

    await createSession(payload);
    return { success: true, exists: true, tenantUrl: `https://${existingGoogleUser.tenant.slug}.medisoftcore.com` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo validar tu cuenta" };
  }
}
