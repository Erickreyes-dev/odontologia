import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { sendWhatsappTextMessage } from "@/lib/meta-whatsapp";

export type TenantWhatsappSendResult =
  | { success: true }
  | { success: false; error: string };

export function formatWhatsappMoney(amount: number, currency = "HNL") {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatWhatsappDate(date: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export async function sendTenantWhatsappTextMessage({
  to,
  body,
}: {
  to?: string | null;
  body: string;
}): Promise<TenantWhatsappSendResult> {
  const { tenantId } = await getTenantContext();
  const connection = await prisma.whatsappConnection.findFirst({
    where: { tenantId, status: "connected" },
    orderBy: { updateAt: "desc" },
  });

  if (!connection) {
    return { success: false, error: "No hay una conexión de WhatsApp activa para esta clínica." };
  }

  if (!to) {
    return { success: false, error: "El paciente no tiene teléfono registrado para WhatsApp." };
  }

  try {
    await sendWhatsappTextMessage({
      phoneNumberId: connection.phoneNumberId,
      to,
      body,
    });
    return { success: true };
  } catch (error) {
    console.error("Error enviando mensaje por WhatsApp:", error);
    return { success: false, error: error instanceof Error ? error.message : "No se pudo enviar el mensaje por WhatsApp." };
  }
}
