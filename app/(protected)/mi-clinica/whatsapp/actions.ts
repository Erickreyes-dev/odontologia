"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface TenantWhatsappConfigView {
  provider: string;
  estado: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsappNumber: string;
  webhookSecret: string;
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
      twilioAccountSid: true,
      twilioAuthToken: true,
      twilioWhatsappNumber: true,
      webhookSecret: true,
      mensajeAutoRespuesta: true,
      aceptaAgendamientoChat: true,
      activo: true,
    },
  });

  if (!config) {
    return {
      provider: "twilio",
      estado: "desconectado",
      twilioAccountSid: "",
      twilioAuthToken: "",
      twilioWhatsappNumber: "",
      webhookSecret: "",
      mensajeAutoRespuesta: DEFAULT_AUTO_REPLY,
      aceptaAgendamientoChat: true,
      activo: false,
    };
  }

  return {
    provider: config.provider,
    estado: config.estado,
    twilioAccountSid: config.twilioAccountSid ?? "",
    twilioAuthToken: config.twilioAuthToken ?? "",
    twilioWhatsappNumber: config.twilioWhatsappNumber ?? "",
    webhookSecret: config.webhookSecret ?? "",
    mensajeAutoRespuesta: config.mensajeAutoRespuesta ?? DEFAULT_AUTO_REPLY,
    aceptaAgendamientoChat: Boolean(config.aceptaAgendamientoChat),
    activo: Boolean(config.activo),
  };
}

export async function upsertTenantWhatsappConfig(input: {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsappNumber: string;
  webhookSecret?: string;
  mensajeAutoRespuesta?: string;
  aceptaAgendamientoChat?: boolean;
  activo?: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.TenantId || !session.Permiso?.includes("editar_tenant")) {
    return { success: false, error: "No tiene permisos para editar esta configuración" };
  }

  const accountSid = input.twilioAccountSid.trim();
  const authToken = input.twilioAuthToken.trim();
  const whatsappNumber = input.twilioWhatsappNumber.replace(/^whatsapp:/i, "").trim();
  const webhookSecret = (input.webhookSecret || "").trim();
  const mensajeAutoRespuesta =
    (input.mensajeAutoRespuesta || DEFAULT_AUTO_REPLY).trim().slice(0, 500) || DEFAULT_AUTO_REPLY;

  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid)) {
    return { success: false, error: "El Account SID de Twilio no es válido" };
  }

  if (authToken.length < 20) {
    return { success: false, error: "El Auth Token de Twilio parece inválido" };
  }

  if (!/^\+\d{7,15}$/.test(whatsappNumber)) {
    return { success: false, error: "Número WhatsApp inválido. Use formato internacional, por ejemplo +50499990000" };
  }

  await prisma.tenantWhatsappConfig.upsert({
    where: { tenantId: session.TenantId },
    update: {
      provider: "twilio",
      estado: "conectado",
      twilioAccountSid: accountSid,
      twilioAuthToken: authToken,
      twilioWhatsappNumber: whatsappNumber,
      webhookSecret: webhookSecret || null,
      mensajeAutoRespuesta,
      aceptaAgendamientoChat: input.aceptaAgendamientoChat ?? true,
      activo: input.activo ?? true,
    },
    create: {
      tenantId: session.TenantId,
      provider: "twilio",
      estado: "conectado",
      twilioAccountSid: accountSid,
      twilioAuthToken: authToken,
      twilioWhatsappNumber: whatsappNumber,
      webhookSecret: webhookSecret || null,
      mensajeAutoRespuesta,
      aceptaAgendamientoChat: input.aceptaAgendamientoChat ?? true,
      activo: input.activo ?? true,
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
      twilioAccountSid: true,
      twilioAuthToken: true,
      twilioWhatsappNumber: true,
    },
  });

  if (!config?.activo) {
    return { success: false, error: "La integración WhatsApp no está activa" };
  }

  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioWhatsappNumber) {
    return { success: false, error: "Faltan credenciales de Twilio" };
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
  form.set("From", `whatsapp:${config.twilioWhatsappNumber}`);
  form.set("To", `whatsapp:${toPhone}`);
  form.set("Body", body);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString("base64")}`,
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
      fromPhone: config.twilioWhatsappNumber,
      toPhone,
      cuerpo: body,
      tipoEvento: "test_send",
      estadoEntrega: payload.status,
    },
  });

  revalidatePath("/mi-clinica/whatsapp");
  return { success: true };
}
