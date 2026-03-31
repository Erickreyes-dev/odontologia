"use server";

import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { addHours, isAfter } from "date-fns";
import { headers } from "next/headers";
import { TENANT_PERMISSIONS } from "@/lib/permission-catalog";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/sendEmail";
import { generateRegistrationVerificationEmailHtml } from "@/lib/templates/verifyRegistrationEmail";
import { generateRootTenantRegistrationNotificationHtml } from "@/lib/templates/rootTenantRegistrationNotificationEmail";
import { resolveCurrencyByCountry } from "@/lib/country-currency";
import { calculateExpirationDateByPlan } from "@/lib/subscription-status";

const TOKEN_TTL_HOURS = 2;

type TeamSize = "1" | "2" | "3-5" | ">5";
type PlanPeriod = "mensual" | "trimestral" | "semestral" | "anual";

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

function resolveCurrentOriginFromRequest() {
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";

  if (host) return `${proto}://${host}`;

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function usernameFromEmail(email: string) {
  return email.split("@")[0].slice(0, 50);
}

export async function requestEmailRegistrationVerification(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Ingresa un correo válido" } as const;
  }

  const alreadyExists = await prisma.usuarios.findFirst({
    where: {
      activo: true,
      OR: [{ correo: email }, { Empleados: { correo: email } }],
    },
    select: { id: true },
  });

  if (alreadyExists) {
    return { success: false, error: "Ese correo ya está registrado. Inicia sesión o recupera tu contraseña." } as const;
  }

  const token = randomUUID() + randomBytes(16).toString("hex");
  const expiresAt = addHours(new Date(), TOKEN_TTL_HOURS);

  await prisma.registrationEmailToken.deleteMany({ where: { email, consumedAt: null } });
  await prisma.registrationEmailToken.create({
    data: {
      id: randomUUID(),
      email,
      token,
      expiresAt,
    },
  });

  const baseUrl = resolveCurrentOriginFromRequest();
  const verificationLink = `${baseUrl}/registro-clinica?emailToken=${encodeURIComponent(token)}`;
  const emailService = new EmailService();

  await emailService.sendMail({
    to: email,
    subject: "Verifica tu correo para crear tu clínica",
    html: generateRegistrationVerificationEmailHtml(email, verificationLink),
    text: `Verifica tu correo para continuar el registro: ${verificationLink}`,
  });

  return { success: true } as const;
}

export async function validateEmailRegistrationToken(token: string) {
  if (!token) return { valid: false, error: "Token inválido" } as const;

  const record = await prisma.registrationEmailToken.findUnique({ where: { token } });
  if (!record || record.consumedAt || isAfter(new Date(), record.expiresAt)) {
    return { valid: false, error: "El enlace de verificación es inválido o expiró" } as const;
  }

  if (!record.verifiedAt) {
    await prisma.registrationEmailToken.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });
  }

  return { valid: true, email: record.email } as const;
}

export async function registerTenantWithEmail(input: {
  emailToken: string;
  contactName: string;
  password: string;
  consultorioNombre: string;
  teamSize: TeamSize;
  paisCodigo: string;
  packageId: string;
  periodoPlan: PlanPeriod;
}) {
  const verification = await validateEmailRegistrationToken(input.emailToken);
  if (!verification.valid) {
    return { success: false, error: verification.error } as const;
  }

  const cleanName = input.contactName.trim();
  if (cleanName.length < 3) {
    return { success: false, error: "Ingresa tu nombre de contacto" } as const;
  }

  if (input.password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres" } as const;
  }

  const consultorioNombre = input.consultorioNombre.trim();
  if (consultorioNombre.length < 3) {
    return { success: false, error: "Ingresa el nombre de la clínica" } as const;
  }

  const selectedPackage = await prisma.paquete.findFirst({ where: { id: input.packageId, activo: true } });
  if (!selectedPackage) {
    return { success: false, error: "El paquete seleccionado no está disponible" } as const;
  }

  const trialConfigActivo = Boolean(selectedPackage.trialActivo);
  const trialConfigDias = Math.max(0, Number(selectedPackage.trialDias ?? 0));
  if (!trialConfigActivo || trialConfigDias <= 0) {
    return {
      success: false,
      error: "El registro con correo está disponible para paquetes con prueba gratis activa.",
    } as const;
  }

  const slugBase = normalizeSlug(consultorioNombre);
  let slug = slugBase;
  let suffix = 1;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${suffix}`.slice(0, 60);
    suffix += 1;
  }

  const currency = resolveCurrencyByCountry(input.paisCodigo);
  const hashedPassword = await bcrypt.hash(input.password, 10);

  const created = await prisma.$transaction(async (tx) => {
    const trialEndsAt = new Date(Date.now() + trialConfigDias * 24 * 60 * 60 * 1000);

    const tenant = await tx.tenant.create({
      data: {
        id: randomUUID(),
        nombre: consultorioNombre,
        slug,
        plan: selectedPackage.nombre,
        paqueteId: selectedPackage.id,
        maxUsuarios: selectedPackage.maxUsuarios,
        periodoPlan: "mensual",
        proximoPago: trialEndsAt,
        contactoNombre: cleanName,
        contactoCorreo: verification.email,
        authProvider: "password",
        teamSize: input.teamSize,
        paisCodigo: input.paisCodigo,
        monedaCodigo: currency.currency,
        trialEndsAt,
        fechaExpiracion: trialEndsAt ?? calculateExpirationDateByPlan("mensual"),
        estado: "vigente",
        activo: true,
      },
    });

    const permisos = [] as { id: string; nombre: string }[];
    for (const permission of TENANT_PERMISSIONS) {
      const createdPermiso = await tx.permiso.upsert({
        where: { nombre: permission.nombre },
        update: { descripcion: permission.descripcion, activo: true },
        create: {
          id: randomUUID(),
          nombre: permission.nombre,
          descripcion: permission.descripcion,
          activo: true,
        },
      });
      permisos.push({ id: createdPermiso.id, nombre: createdPermiso.nombre });
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

    const baseUser = usernameFromEmail(verification.email);
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
        correo: verification.email,
        contrasena: hashedPassword,
        empleado_id: null,
        rol_id: adminRole.id,
        activo: true,
        DebeCambiarPassword: false,
      },
    });

    await tx.registrationEmailToken.update({
      where: { token: input.emailToken },
      data: { consumedAt: new Date() },
    });

    return {
      tenantUrl: `https://${tenant.slug}.medisoftcore.com`,
      username: user.usuario,
      tenantSlug: tenant.slug,
      planNombre: selectedPackage.nombre,
      contactoNombre: cleanName,
      contactoCorreo: verification.email,
    };
  });

  const rootNotificationEmail = process.env.ROOT_NOTIFICATION_EMAIL?.trim() || process.env.ROOT_EMAIL?.trim();
  if (rootNotificationEmail) {
    const emailService = new EmailService();
    try {
      await emailService.sendMail({
        to: rootNotificationEmail,
        subject: `Nuevo tenant registrado: ${consultorioNombre}`,
        html: generateRootTenantRegistrationNotificationHtml({
          consultorioNombre,
          tenantSlug: created.tenantSlug,
          contactoNombre: created.contactoNombre,
          contactoCorreo: created.contactoCorreo,
          planNombre: created.planNombre,
          teamSize: input.teamSize,
          paisCodigo: input.paisCodigo,
        }),
        text: `Nuevo tenant registrado: ${consultorioNombre} (${created.tenantSlug}) | Contacto: ${created.contactoNombre} <${created.contactoCorreo}> | Plan: ${created.planNombre} | Team: ${input.teamSize} | País: ${input.paisCodigo}`,
      });
    } catch (error) {
      console.error("No se pudo enviar la notificación de nuevo tenant al correo root", error);
    }
  }

  return { success: true, tenantUrl: created.tenantUrl, username: created.username } as const;
}
