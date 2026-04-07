import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizeWhatsappPhone,
  parseAppointmentFromWhatsapp,
  twimlResponse,
  validateTwilioSignature,
  type TwilioInboundPayload,
} from "@/lib/whatsapp/twilio";

function xmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = Object.fromEntries(formData.entries()) as Record<string, string>;
    const twilioPayload = payload as TwilioInboundPayload;

    const incomingTo = normalizeWhatsappPhone(twilioPayload.To);
    if (!incomingTo) {
      return xmlResponse(twimlResponse("Número destino no recibido"), 400);
    }

    const config = await prisma.tenantWhatsappConfig.findFirst({
      where: {
        twilioWhatsappNumber: incomingTo,
        estado: "conectado",
        activo: true,
      },
      select: {
        id: true,
        tenantId: true,
        twilioAuthToken: true,
        webhookSecret: true,
        mensajeAutoRespuesta: true,
        aceptaAgendamientoChat: true,
      },
    });

    if (!config) {
      return xmlResponse(twimlResponse("Esta clínica no tiene WhatsApp activo."), 404);
    }

    const signature = request.headers.get("x-twilio-signature");
    const authToken = config.webhookSecret || config.twilioAuthToken;

    if (authToken) {
      const isSignatureValid = validateTwilioSignature({
        authToken,
        url: request.url,
        signature,
        payload,
      });

      if (!isSignatureValid) {
        return xmlResponse(twimlResponse("Firma webhook inválida"), 403);
      }
    }

    const fromPhone = normalizeWhatsappPhone(twilioPayload.From);
    const rawBody = (twilioPayload.Body || "").trim();
    const mediaCount = Number.parseInt(twilioPayload.NumMedia || "0", 10);

    const mediaUrls: string[] = [];
    if (mediaCount > 0) {
      for (let index = 0; index < mediaCount; index += 1) {
        const mediaUrl = payload[`MediaUrl${index}`];
        if (mediaUrl) {
          mediaUrls.push(mediaUrl);
        }
      }
    }

    await prisma.tenantWhatsappMensaje.create({
      data: {
        tenantId: config.tenantId,
        configId: config.id,
        direccion: "entrante",
        mensajeSid: twilioPayload.MessageSid,
        fromPhone,
        toPhone: incomingTo,
        cuerpo: rawBody.slice(0, 1600),
        mediaCount: Number.isNaN(mediaCount) ? 0 : mediaCount,
        mediaUrls: mediaUrls.length ? JSON.stringify(mediaUrls) : null,
        tipoEvento: "inbound_message",
      },
    });

    if (config.aceptaAgendamientoChat) {
      const appointment = parseAppointmentFromWhatsapp(rawBody, fromPhone);

      if (appointment) {
        await prisma.solicitudCitaPublica.create({
          data: {
            tenantId: config.tenantId,
            fechaSolicitada: appointment.fechaSolicitada,
            nombrePaciente: appointment.nombrePaciente,
            correoPaciente: appointment.correoPaciente,
            telefonoPaciente: appointment.telefonoPaciente,
            motivo: `[WhatsApp] ${appointment.motivo}`.slice(0, 500),
          },
        });

        return xmlResponse(
          twimlResponse(
            "✅ Solicitud de cita recibida. Nuestro equipo confirmará disponibilidad pronto.",
          ),
        );
      }
    }

    if (mediaCount > 0) {
      return xmlResponse(
        twimlResponse(
          "Documento recibido. El equipo de la clínica lo revisará y responderá por este mismo chat.",
        ),
      );
    }

    return xmlResponse(
      twimlResponse(
        config.mensajeAutoRespuesta ||
          "Gracias por escribir. Para solicitar cita use: CITA|YYYY-MM-DD HH:mm|Nombre|correo@dominio.com|telefono|Motivo",
      ),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo procesar webhook de WhatsApp",
      },
      { status: 500 },
    );
  }
}
