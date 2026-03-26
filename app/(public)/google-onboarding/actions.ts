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

export async function registerTenantWithGoogle(input: GoogleOnboardingInput): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const identity = await verifyGoogleCredential(input.credential);
    const consultorioNombre = input.consultorioNombre.trim();

    if (consultorioNombre.length < 3) {
      return { success: false, error: "El nombre del consultorio es obligatorio" };
    }

    const starterPackage = await prisma.paquete.findFirst({ where: { activo: true }, orderBy: { createAt: "asc" } });
    if (!starterPackage) {
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
          plan: starterPackage.nombre,
          paqueteId: starterPackage.id,
          maxUsuarios: starterPackage.maxUsuarios,
          periodoPlan: "trimestral",
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
          paqueteId: starterPackage.id,
          periodoPlan: "trimestral",
          monto: starterPackage.precioTrimestral ?? Number(starterPackage.precio) * 3,
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

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo completar el registro" };
  }
}
