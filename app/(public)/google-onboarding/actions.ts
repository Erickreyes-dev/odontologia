"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { TENANT_PERMISSIONS } from "@/lib/permission-catalog";
import { resolveCurrencyByCountry } from "@/lib/country-currency";
import { encrypt, type UsuarioSesion } from "@/auth";
import { cookies } from "next/headers";

interface GoogleOnboardingInput {
  credential: string;
  consultorioNombre: string;
  teamSize: "1" | "2" | "3-5" | ">5";
  paisCodigo: string;
  packageId: string;
  periodoPlan: "mensual" | "trimestral" | "anual";
  freeTrialEnabled: boolean;
  trialDays: number;
}

function resolveMontoByPeriod(paquete: { precio: any; precioTrimestral: any; precioAnual: any }, periodoPlan: GoogleOnboardingInput["periodoPlan"]) {
  if (periodoPlan === "trimestral") return Number(paquete.precioTrimestral ?? Number(paquete.precio) * 3);
  if (periodoPlan === "anual") return Number(paquete.precioAnual ?? Number(paquete.precio) * 12);
  return Number(paquete.precio);
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
  cookies().set("session", token, { expires: new Date(Date.now() + 6 * 60 * 60 * 1000), httpOnly: true, path: "/" });
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

export async function registerTenantWithGoogle(input: GoogleOnboardingInput): Promise<{ success: true; tenantUrl: string; alreadyExists?: boolean } | { success: false; error: string }> {
  try {
    if (!input.credential) return { success: false, error: "Debes autenticar con Google para continuar" };
    if (!input.packageId) return { success: false, error: "Selecciona un paquete para continuar" };
    if (input.freeTrialEnabled && (input.trialDays < 1 || input.trialDays > 60)) {
      return { success: false, error: "Los días de prueba deben estar entre 1 y 60" };
    }

    const identity = await verifyGoogleCredential(input.credential);
    const consultorioNombre = input.consultorioNombre.trim();

    if (consultorioNombre.length < 3) {
      return { success: false, error: "El nombre del consultorio es obligatorio" };
    }

    const existingGoogleUser = await findGoogleUserByEmail(identity.email);
    if (existingGoogleUser?.tenant && existingGoogleUser.tenantId) {
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
        iss: "odontologia-saas",
        aud: "odontologia-clients",
      };

      await createSession(payload);
      return { success: true, tenantUrl: `https://${existingGoogleUser.tenant.slug}.medisoftcore.com`, alreadyExists: true };
    }

    const selectedPackage = await prisma.paquete.findFirst({ where: { id: input.packageId, activo: true } });
    if (!selectedPackage) {
      return { success: false, error: "El paquete seleccionado ya no está disponible" };
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
      const trialEndsAt = input.freeTrialEnabled ? new Date(Date.now() + input.trialDays * 24 * 60 * 60 * 1000) : null;

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

      const monto = resolveMontoByPeriod(selectedPackage, input.periodoPlan);
      await tx.tenantInvoice.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          paqueteId: selectedPackage.id,
          periodoPlan: input.periodoPlan,
          monto,
          subtotal: monto,
          impuesto: 0,
          total: monto,
          moneda: "USD",
          estado: "pendiente",
          numeroFactura: `INV-${Date.now()}`,
          facturarNombre: identity.name,
          facturarCorreo: identity.email,
          facturarPais: input.paisCodigo,
          descripcion: `Suscripción ${selectedPackage.nombre} (${input.periodoPlan})`,
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
      iss: "odontologia-saas",
      aud: "odontologia-clients",
    };

    await createSession(payload);

    return { success: true, tenantUrl: `https://${result.tenant.slug}.medisoftcore.com` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo completar el registro" };
  }
}
