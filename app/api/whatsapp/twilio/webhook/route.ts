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
    const incomingFrom = normalizeWhatsappPhone(twilioPayload.From);
    if (!incomingTo) {
      return xmlResponse(twimlResponse("Número destino no recibido"), 400);
    }

    let config = await prisma.tenantWhatsappConfig.findFirst({
      where: {
        twilioWhatsappNumber: incomingTo,
        estado: "conectado",
        activo: true,
      },
      select: {
        id: true,
        tenantId: true,
        mensajeAutoRespuesta: true,
        aceptaAgendamientoChat: true,
      },
    });

    if (!config && incomingFrom) {
      const lastOutbound = await prisma.tenantWhatsappMensaje.findFirst({
        where: {
          direccion: "saliente",
          toPhone: incomingFrom,
        },
        orderBy: { createAt: "desc" },
        select: { tenantId: true, configId: true },
      });

      if (lastOutbound?.tenantId) {
        config = await prisma.tenantWhatsappConfig.findFirst({
          where: {
            tenantId: lastOutbound.tenantId,
            estado: "conectado",
            activo: true,
          },
          select: {
            id: true,
            tenantId: true,
            mensajeAutoRespuesta: true,
            aceptaAgendamientoChat: true,
          },
        });
      }
    }

    if (!config) {
      return xmlResponse(twimlResponse("No se encontró tenant de destino para este mensaje."), 404);
    }

    const signature = request.headers.get("x-twilio-signature");
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";

    if (authToken.length >= 20) {
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

    const fromPhone = incomingFrom;
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
