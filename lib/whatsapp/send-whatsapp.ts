"use server";

import { prisma } from "@/lib/prisma";

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "").trim();
  if (!cleaned.startsWith("+")) {
    return `+${cleaned.replace(/^\+/, "")}`;
  }
  return cleaned;
}

function getTwilioEnvOrThrow() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
  const fromPhone = process.env.TWILIO_WHATSAPP_FROM?.replace(/^whatsapp:/i, "").trim() || "";

  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || authToken.length < 20 || !/^\+\d{7,15}$/.test(fromPhone)) {
    throw new Error("Twilio no está configurado en variables de entorno");
  }

  return { accountSid, authToken, fromPhone };
}

export async function sendTenantWhatsappMessage(input: {
  tenantId: string;
  toPhone: string;
  body: string;
  tipoEvento: string;
  configId?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const config = await prisma.tenantWhatsappConfig.findUnique({
      where: { tenantId: input.tenantId },
      select: { id: true, activo: true, estado: true },
    });

    if (!config?.activo || config.estado !== "conectado") {
      return { success: false, error: "WhatsApp no está activo para esta clínica" };
    }

    const toPhone = normalizePhone(input.toPhone);
    if (!/^\+\d{7,15}$/.test(toPhone)) {
      return { success: false, error: "Número destino inválido" };
    }

    const body = input.body.trim().slice(0, 1500);
    if (!body) {
      return { success: false, error: "Mensaje vacío" };
    }

    const { accountSid, authToken, fromPhone } = getTwilioEnvOrThrow();

    const form = new URLSearchParams();
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
      return { success: false, error: payload.message ?? "Twilio rechazó el mensaje" };
    }

    await prisma.tenantWhatsappMensaje.create({
      data: {
        tenantId: input.tenantId,
        configId: input.configId ?? config.id,
        direccion: "saliente",
        mensajeSid: payload.sid,
        fromPhone,
        toPhone,
        cuerpo: body,
        tipoEvento: input.tipoEvento,
        estadoEntrega: payload.status,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo enviar WhatsApp" };
  }
}
