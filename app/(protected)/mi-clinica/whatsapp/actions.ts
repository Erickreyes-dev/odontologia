"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface TenantWhatsappConfigView {
  provider: string;
  estado: string;
  twilioWhatsappNumber: string;
  verifiedAt: string | null;
  mensajeAutoRespuesta: string;
  aceptaAgendamientoChat: boolean;
  activo: boolean;
}

const DEFAULT_AUTO_REPLY =
  "Gracias por escribir a la clínica. Para solicitar una cita envíe: CITA|YYYY-MM-DD HH:mm|Nombre|correo@dominio.com|telefono|Motivo";

export async function getTenantWhatsappConfig(): Promise<TenantWhatsappConfigView | null> {
  const session = await getSession();
  if (!session?.TenantId) return null;

  const config = await prisma.tenantWhatsappConfig.findUnique({
    where: { tenantId: session.TenantId },
    select: {
      provider: true,
      estado: true,
      twilioWhatsappNumber: true,
      verifiedAt: true,
      mensajeAutoRespuesta: true,
      aceptaAgendamientoChat: true,
      activo: true,
    },
  });

  if (!config) {
    return {
      provider: "twilio",
      estado: "desconectado",
      twilioWhatsappNumber: "",
      verifiedAt: null,
      mensajeAutoRespuesta: DEFAULT_AUTO_REPLY,
      aceptaAgendamientoChat: true,
      activo: false,
    };
  }

  return {
    provider: config.provider,
    estado: config.estado,
    twilioWhatsappNumber: config.twilioWhatsappNumber ?? "",
    verifiedAt: config.verifiedAt ? config.verifiedAt.toISOString() : null,
    mensajeAutoRespuesta: config.mensajeAutoRespuesta ?? DEFAULT_AUTO_REPLY,
    aceptaAgendamientoChat: Boolean(config.aceptaAgendamientoChat),
    activo: Boolean(config.activo),
  };
}

export async function upsertTenantWhatsappConfig(input: {
  twilioWhatsappNumber: string;
  mensajeAutoRespuesta?: string;
  aceptaAgendamientoChat?: boolean;
  activo?: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.TenantId || !session.Permiso?.includes("editar_tenant")) {
    return { success: false, error: "No tiene permisos para editar esta configuración" };
  }

  const whatsappNumber = input.twilioWhatsappNumber.replace(/^whatsapp:/i, "").trim();
  const mensajeAutoRespuesta =
    (input.mensajeAutoRespuesta || DEFAULT_AUTO_REPLY).trim().slice(0, 500) || DEFAULT_AUTO_REPLY;

  if (!/^\+\d{7,15}$/.test(whatsappNumber)) {
    return { success: false, error: "Número WhatsApp inválido. Use formato internacional, por ejemplo +50499990000" };
  }

  await prisma.tenantWhatsappConfig.upsert({
    where: { tenantId: session.TenantId },
    update: {
      provider: "twilio",
      estado: "pendiente_verificacion",
      twilioWhatsappNumber: whatsappNumber,
      webhookSecret: null,
      mensajeAutoRespuesta,
      aceptaAgendamientoChat: input.aceptaAgendamientoChat ?? true,
      activo: input.activo ?? false,
      verifiedAt: null,
    },
    create: {
      tenantId: session.TenantId,
      provider: "twilio",
      estado: "pendiente_verificacion",
      twilioWhatsappNumber: whatsappNumber,
      webhookSecret: null,
      mensajeAutoRespuesta,
      aceptaAgendamientoChat: input.aceptaAgendamientoChat ?? true,
      activo: input.activo ?? false,
    },
  });

  revalidatePath("/mi-clinica/whatsapp");
  return { success: true };
}

function getTwilioEnvOrThrow() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
  const fromPhone = process.env.TWILIO_WHATSAPP_FROM?.replace(/^whatsapp:/i, "").trim() || "";

  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || authToken.length < 20 || !/^\+\d{7,15}$/.test(fromPhone)) {
    throw new Error("Faltan variables de entorno de Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)");
  }

  return { accountSid, authToken, fromPhone };
}

export async function sendWhatsappVerificationCode(): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.TenantId || !session.Permiso?.includes("editar_tenant")) {
      return { success: false, error: "No tiene permisos para verificar este número" };
    }

    const config = await prisma.tenantWhatsappConfig.findUnique({
      where: { tenantId: session.TenantId },
      select: { id: true, twilioWhatsappNumber: true },
    });

    if (!config?.twilioWhatsappNumber) {
      return { success: false, error: "Primero guarda un número de WhatsApp" };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { accountSid, authToken, fromPhone } = getTwilioEnvOrThrow();

    const form = new URLSearchParams();
    form.set("From", `whatsapp:${fromPhone}`);
    form.set("To", `whatsapp:${config.twilioWhatsappNumber}`);
    form.set("Body", `Código de verificación de tu clínica: ${code}`);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const payload = await response.json() as { message?: string };
    if (!response.ok) {
      return { success: false, error: payload.message ?? "No se pudo enviar código de verificación" };
    }

    await prisma.tenantWhatsappConfig.update({
      where: { id: config.id },
      data: {
        verificationCode: code,
        estado: "pendiente_verificacion",
        activo: false,
        verifiedAt: null,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo enviar verificación" };
  }
}

export async function verifyWhatsappNumber(input: { code: string }): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.TenantId || !session.Permiso?.includes("editar_tenant")) {
    return { success: false, error: "No tiene permisos para verificar este número" };
  }

  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "Código inválido (6 dígitos)" };
  }

  const config = await prisma.tenantWhatsappConfig.findUnique({
    where: { tenantId: session.TenantId },
    select: { id: true, verificationCode: true },
  });

  if (!config?.verificationCode) {
    return { success: false, error: "No hay código pendiente. Solicita uno nuevo." };
  }

  if (config.verificationCode !== code) {
    return { success: false, error: "Código de verificación incorrecto" };
  }

  await prisma.tenantWhatsappConfig.update({
    where: { id: config.id },
    data: {
      verificationCode: null,
      verifiedAt: new Date(),
      estado: "conectado",
      activo: true,
    },
  });

  revalidatePath("/mi-clinica/whatsapp");
  return { success: true };
}

export async function sendWhatsappTestMessage(input: {
  toPhone: string;
  body: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.TenantId) {
    return { success: false, error: "Sesión inválida" };
  }

  const config = await prisma.tenantWhatsappConfig.findUnique({
    where: { tenantId: session.TenantId },
    select: {
      id: true,
      activo: true,
      twilioWhatsappNumber: true,
    },
  });

  if (!config?.activo) {
    return { success: false, error: "La integración WhatsApp no está activa" };
  }

  if (!config.twilioWhatsappNumber) {
    return { success: false, error: "Falta número WhatsApp de la clínica" };
  }

  const toPhone = input.toPhone.replace(/^whatsapp:/i, "").trim();
  if (!/^\+\d{7,15}$/.test(toPhone)) {
    return { success: false, error: "Número destino inválido" };
  }

  const body = input.body.trim().slice(0, 1500);
  if (!body) {
    return { success: false, error: "El mensaje está vacío" };
  }

  const form = new URLSearchParams();
  const { accountSid, authToken, fromPhone } = getTwilioEnvOrThrow();

  form.set("From", `whatsapp:${fromPhone}`);
  form.set("To", `whatsapp:${toPhone}`);
  form.set("Body", body);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const payload = await response.json() as { sid?: string; status?: string; message?: string };

  if (!response.ok) {
    return { success: false, error: payload.message ?? "No se pudo enviar el mensaje por Twilio" };
  }

  await prisma.tenantWhatsappMensaje.create({
    data: {
      tenantId: session.TenantId,
      configId: config.id,
      direccion: "saliente",
      mensajeSid: payload.sid,
      fromPhone,
      toPhone,
      cuerpo: body,
      tipoEvento: "test_send",
      estadoEntrega: payload.status,
    },
  });

  revalidatePath("/mi-clinica/whatsapp");
  return { success: true };
}
