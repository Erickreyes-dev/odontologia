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
  packageCode: "start" | "growth" | "pro" | "enterprise";
  periodoPlan: "mensual" | "trimestral" | "anual";
}

const packageConfig = {
  start: { keywords: ["start", "starter"], label: "Start Clinic" },
  growth: { keywords: ["growth"], label: "Growth Clinic" },
  pro: { keywords: ["pro"], label: "Pro Revenue" },
  enterprise: { keywords: ["enterprise", "multi"], label: "Multi-Clinic / Enterprise" },
} as const;

function resolveMontoByPeriod(paquete: { precio: any; precioTrimestral: any; precioAnual: any }, periodoPlan: GoogleOnboardingInput["periodoPlan"]) {
  if (periodoPlan === "trimestral") return Number(paquete.precioTrimestral ?? Number(paquete.precio) * 3);
  if (periodoPlan === "anual") return Number(paquete.precioAnual ?? Number(paquete.precio) * 12);
  return Number(paquete.precio);
}

async function resolvePackageForRegistration(packageCode: GoogleOnboardingInput["packageCode"]) {
  const activePackages = await prisma.paquete.findMany({
    where: { activo: true },
    orderBy: [{ maxUsuarios: "asc" }, { precio: "asc" }],
  });

  if (!activePackages.length) return null;

  const config = packageConfig[packageCode];
  const byName = activePackages.find((pkg) =>
    config.keywords.some((keyword) => pkg.nombre.toLowerCase().includes(keyword)),
  );

  if (byName) return byName;

  if (packageCode === "enterprise") return activePackages[activePackages.length - 1];
  if (packageCode === "pro") return activePackages.find((pkg) => pkg.maxUsuarios >= 40) ?? activePackages[activePackages.length - 1];
  if (packageCode === "growth") return activePackages.find((pkg) => pkg.maxUsuarios >= 20) ?? activePackages[Math.min(1, activePackages.length - 1)];
  return activePackages[0];
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
    email: String(tokenInfo.email),
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

export async function registerTenantWithGoogle(input: GoogleOnboardingInput): Promise<{ success: true; tenantUrl: string } | { success: false; error: string }> {
  try {
    const identity = await verifyGoogleCredential(input.credential);
    const consultorioNombre = input.consultorioNombre.trim();

    if (consultorioNombre.length < 3) {
      return { success: false, error: "El nombre del consultorio es obligatorio" };
    }

    const selectedPackage = await resolvePackageForRegistration(input.packageCode);
    if (!selectedPackage) {
      return { success: false, error: "No hay paquetes activos para crear la prueba" };
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
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

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

      const user = await tx.usuarios.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          usuario: identity.email.toLowerCase(),
          contrasena: tempPassword,
          empleado_id: null,
          rol_id: adminRole.id,
          activo: true,
          DebeCambiarPassword: false,
        },
      });

      await tx.tenantInvoice.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          paqueteId: selectedPackage.id,
          periodoPlan: input.periodoPlan,
          monto: resolveMontoByPeriod(selectedPackage, input.periodoPlan),
          moneda: "USD",
          estado: "pendiente",
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

    const token = await encrypt(payload);
    cookies().set("session", token, { expires: new Date(Date.now() + 6 * 60 * 60 * 1000), httpOnly: true, path: "/" });

    return { success: true, tenantUrl: `https://${result.tenant.slug}.medisoftcore.com` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo completar el registro" };
  }
}
