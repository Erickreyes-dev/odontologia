import crypto from "crypto";

export interface TwilioInboundPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  ProfileName?: string;
  [key: string]: string | undefined;
}

export function normalizeWhatsappPhone(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/^whatsapp:/i, "").trim();
}

export function validateTwilioSignature(params: {
  authToken: string;
  url: string;
  signature: string | null;
  payload: Record<string, string>;
}): boolean {
  const { authToken, url, signature, payload } = params;
  if (!signature) return false;

  const sortedEntries = Object.entries(payload).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  const data = `${url}${sortedEntries.map(([key, value]) => `${key}${value}`).join("")}`;
  const expected = crypto.createHmac("sha1", authToken).update(data).digest("base64");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

interface ParsedAppointmentRequest {
  fechaSolicitada: Date;
  nombrePaciente: string;
  correoPaciente: string;
  telefonoPaciente: string;
  motivo: string;
}

export function parseAppointmentFromWhatsapp(message: string, fromPhone: string): ParsedAppointmentRequest | null {
  const normalizedMessage = message.trim();
  if (!normalizedMessage.toUpperCase().startsWith("CITA|")) {
    return null;
  }

  const pieces = normalizedMessage.split("|").map((piece) => piece.trim());
  if (pieces.length < 6) {
    return null;
  }

  const [, fechaHoraText, nombrePaciente, correoPaciente, telefonoPaciente, ...motivoParts] = pieces;
  const fechaSolicitada = new Date(fechaHoraText.replace(" ", "T"));

  if (Number.isNaN(fechaSolicitada.getTime())) {
    return null;
  }

  const correo = correoPaciente.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return null;
  }

  const telefonoNormalizado = telefonoPaciente || fromPhone;
  const motivo = motivoParts.join(" | ").slice(0, 500);

  if (!nombrePaciente || !telefonoNormalizado || !motivo) {
    return null;
  }

  return {
    fechaSolicitada,
    nombrePaciente: nombrePaciente.slice(0, 120),
    correoPaciente: correo.slice(0, 150),
    telefonoPaciente: telefonoNormalizado.slice(0, 25),
    motivo,
  };
}

export function twimlResponse(message: string): string {
  const escaped = message
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}
