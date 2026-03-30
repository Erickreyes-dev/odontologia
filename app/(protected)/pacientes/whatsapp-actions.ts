"use server";

import { requireAnyTenantPermission, requireTenantPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere } from "@/lib/tenant-query";
import { getOrCreateConversation, listConversationMessages, sendWhatsAppDocument, sendWhatsAppText } from "@/lib/whatsapp/service";

export async function getPacienteConversation(pacienteId: string) {
  await requireAnyTenantPermission(["ver_conversaciones_whatsapp", "gestionar_conversaciones_whatsapp"]);
  const conversation = await getOrCreateConversation({ pacienteId });
  const messages = await listConversationMessages(conversation.id);
  return { conversation, messages };
}

export async function sendPacienteWhatsAppText(params: { pacienteId: string; conversationId: string; body: string }) {
  const session = await requireTenantPermission("enviar_whatsapp");
  const paciente = await prisma.paciente.findFirst({
    where: await tenantWhere<Prisma.PacienteWhereInput>({ id: params.pacienteId }),
    select: { telefono: true },
  });
  if (!paciente) throw new Error("Paciente no encontrado");

  const message = await sendWhatsAppText({
    conversationId: params.conversationId,
    body: params.body,
    sentByUserId: session.IdUser,
    pacienteTelefono: paciente.telefono,
  });

  return message;
}

export async function sendPacienteWhatsAppDocument(params: {
  pacienteId: string;
  conversationId: string;
  documentUrl: string;
  fileName?: string;
  body?: string;
}) {
  const session = await requireTenantPermission("enviar_whatsapp");
  const paciente = await prisma.paciente.findFirst({
    where: await tenantWhere<Prisma.PacienteWhereInput>({ id: params.pacienteId }),
    select: { telefono: true },
  });
  if (!paciente) throw new Error("Paciente no encontrado");

  const message = await sendWhatsAppDocument({
    conversationId: params.conversationId,
    documentUrl: params.documentUrl,
    fileName: params.fileName,
    body: params.body,
    sentByUserId: session.IdUser,
    pacienteTelefono: paciente.telefono,
  });

  return message;
}
