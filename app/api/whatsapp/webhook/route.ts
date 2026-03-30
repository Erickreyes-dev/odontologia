import { prisma } from "@/lib/prisma";
import { buildWebhookEventId } from "@/lib/whatsapp/service";

function isValidWebhookSignature(request: Request, body: string) {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expected) return true;
  const signature = request.headers.get("x-hub-signature-256");
  // Validación completa HMAC pendiente para fase 2.
  return Boolean(signature || body);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const token = searchParams.get("hub.verify_token");

  if (mode === "subscribe" && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const bodyText = await request.text();
  if (!isValidWebhookSignature(request, bodyText)) {
    return new Response("invalid signature", { status: 401 });
  }

  const payload = JSON.parse(bodyText) as {
    entry?: Array<{ changes?: Array<{ value?: { metadata?: { phone_number_id?: string }; statuses?: Array<{ id?: string; status?: string }>; messages?: Array<{ id?: string; text?: { body?: string }; type?: string; from?: string }> } }> }>;
  };

  const entries = payload.entry ?? [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const connection = await prisma.whatsAppConnection.findFirst({ where: { phoneNumberId, status: "connected" } });
      if (!connection) continue;

      const providerEventId = buildWebhookEventId(value);
      const alreadyExists = await prisma.whatsAppWebhookEvent.findUnique({
        where: { tenantId_providerEventId: { tenantId: connection.tenantId, providerEventId } },
      });
      if (alreadyExists) continue;

      await prisma.whatsAppWebhookEvent.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: connection.tenantId,
          connectionId: connection.id,
          providerEventId,
          payloadJson: JSON.stringify(value),
          processedAt: new Date(),
        },
      });

      for (const status of value?.statuses ?? []) {
        if (!status.id) continue;
        await prisma.chatMessage.updateMany({
          where: { tenantId: connection.tenantId, providerMessageId: status.id },
          data: { providerStatus: mapProviderStatus(status.status) },
        });
      }

      for (const message of value?.messages ?? []) {
        const incomingId = message.id ?? buildWebhookEventId(message);
        const existing = await prisma.chatMessage.findUnique({
          where: { tenantId_providerMessageId: { tenantId: connection.tenantId, providerMessageId: incomingId } },
        });
        if (existing) continue;

        const conversation = await prisma.chatConversation.findFirst({
          where: { tenantId: connection.tenantId, connectionId: connection.id },
          orderBy: { updatedAt: "desc" },
        });
        if (!conversation) continue;

        await prisma.chatMessage.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: connection.tenantId,
            conversationId: conversation.id,
            direction: "inbound",
            type: message.type === "document" ? "document" : "text",
            body: message.text?.body ?? null,
            providerMessageId: incomingId,
            providerStatus: "received",
          },
        });

        await prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });
      }
    }
  }

  return Response.json({ received: true });
}

function mapProviderStatus(status?: string) {
  switch (status) {
    case "sent":
      return "sent" as const;
    case "delivered":
      return "delivered" as const;
    case "read":
      return "read" as const;
    case "failed":
      return "failed" as const;
    default:
      return "queued" as const;
  }
}
