import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";
import { getTenantContext } from "@/lib/tenant";
import { randomUUID, createHash } from "crypto";
import { exchangeMetaCode, sendMetaDocumentMessage, sendMetaTextMessage } from "@/lib/whatsapp/meta";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp/phone";

export async function getTenantWhatsAppConnection() {
  return prisma.whatsAppConnection.findFirst({
    where: await tenantWhere<Prisma.WhatsAppConnectionWhereInput>(),
    orderBy: { updatedAt: "desc" },
  });
}

export async function buildMetaConnectUrl() {
  const { tenantId } = await getTenantContext();
  const state = `${tenantId}:${randomUUID()}`;
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const callback = `${base}/api/whatsapp/connect/callback`;
  const configId = process.env.META_EMBEDDED_SIGNUP_CONFIG_ID;
  if (!configId) {
    throw new Error("Falta META_EMBEDDED_SIGNUP_CONFIG_ID");
  }

  const connectUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  connectUrl.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  connectUrl.searchParams.set("redirect_uri", callback);
  connectUrl.searchParams.set("scope", "whatsapp_business_management,whatsapp_business_messaging,business_management");
  connectUrl.searchParams.set("state", state);
  connectUrl.searchParams.set("config_id", configId);
  return { state, url: connectUrl.toString(), callback };
}

export async function completeMetaConnection(params: {
  code: string;
  state: string;
  expectedTenantId: string;
  businessId: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
}) {
  const [tenantIdFromState] = params.state.split(":");
  if (tenantIdFromState !== params.expectedTenantId) {
    throw new Error("Estado inválido en callback OAuth");
  }

  const base = process.env.APP_URL ?? "http://localhost:3000";
  const callback = `${base}/api/whatsapp/connect/callback`;
  const token = await exchangeMetaCode(params.code, callback);
  const tokenExpiresAt = token.expires_in
    ? new Date(Date.now() + token.expires_in * 1000)
    : null;

  const connection = await prisma.whatsAppConnection.upsert({
    where: {
      tenantId_phoneNumberId: {
        tenantId: params.expectedTenantId,
        phoneNumberId: params.phoneNumberId,
      },
    },
    update: {
      businessId: params.businessId,
      wabaId: params.wabaId,
      displayPhoneNumber: params.displayPhoneNumber ?? null,
      verifiedName: params.verifiedName ?? null,
      accessTokenEncrypted: token.access_token,
      tokenExpiresAt,
      status: "connected",
      billingOwner: "tenant_meta_direct",
      lastSyncAt: new Date(),
    },
    create: {
      id: randomUUID(),
      tenantId: params.expectedTenantId,
      provider: "meta",
      businessId: params.businessId,
      wabaId: params.wabaId,
      phoneNumberId: params.phoneNumberId,
      displayPhoneNumber: params.displayPhoneNumber ?? null,
      verifiedName: params.verifiedName ?? null,
      accessTokenEncrypted: token.access_token,
      tokenExpiresAt,
      status: "connected",
      billingOwner: "tenant_meta_direct",
      lastSyncAt: new Date(),
    },
  });

  return connection;
}

export async function disconnectTenantWhatsAppConnection(connectionId: string) {
  const connection = await prisma.whatsAppConnection.findFirst({
    where: await tenantWhere<Prisma.WhatsAppConnectionWhereInput>({ id: connectionId }),
  });
  if (!connection) throw new Error("Conexión no encontrada");

  return prisma.whatsAppConnection.update({
    where: { id: connection.id },
    data: { status: "disconnected", lastSyncAt: new Date() },
  });
}

export async function getOrCreateConversation(params: { pacienteId: string; connectionId?: string }) {
  const tenantScoped = await tenantWhere<Prisma.ChatConversationWhereInput>({ pacienteId: params.pacienteId });
  const existing = await prisma.chatConversation.findFirst({
    where: {
      ...tenantScoped,
      ...(params.connectionId ? { connectionId: params.connectionId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) return existing;

  const connection = params.connectionId
    ? await prisma.whatsAppConnection.findFirst({
      where: await tenantWhere<Prisma.WhatsAppConnectionWhereInput>({ id: params.connectionId, status: "connected" }),
    })
    : await getTenantWhatsAppConnection();

  if (!connection || connection.status !== "connected") {
    throw new Error("No hay conexión de WhatsApp activa");
  }

  return prisma.chatConversation.create({
    data: await withTenantData({
      id: randomUUID(),
      pacienteId: params.pacienteId,
      connectionId: connection.id,
      estado: "open",
      lastMessageAt: new Date(),
    }),
  });
}

export async function listConversationMessages(conversationId: string) {
  return prisma.chatMessage.findMany({
    where: await tenantWhere<Prisma.ChatMessageWhereInput>({ conversationId }),
    orderBy: { createdAt: "asc" },
  });
}

export async function sendWhatsAppText(params: {
  conversationId: string;
  body: string;
  sentByUserId?: string;
  pacienteTelefono?: string | null;
}) {
  const conversation = await prisma.chatConversation.findFirst({
    where: await tenantWhere<Prisma.ChatConversationWhereInput>({ id: params.conversationId }),
    include: { connection: true },
  });
  if (!conversation) throw new Error("Conversación no encontrada");

  const to = normalizePhoneForWhatsApp(params.pacienteTelefono);
  if (!to) throw new Error("El teléfono del paciente no está en formato internacional válido");

  let providerMessageId: string | null = null;
  let providerStatus: Prisma.ChatMessageCreateInput["providerStatus"] = "queued";
  let errorMessage: string | null = null;

  try {
    const response = await sendMetaTextMessage({
      phoneNumberId: conversation.connection.phoneNumberId,
      accessToken: conversation.connection.accessTokenEncrypted,
      to,
      body: params.body,
    });
    providerMessageId = response.messages?.[0]?.id ?? null;
    providerStatus = providerMessageId ? "sent" : "queued";
  } catch (error) {
    providerStatus = "failed";
    errorMessage = error instanceof Error ? error.message : "Error desconocido";
  }

  const message = await prisma.chatMessage.create({
    data: await withTenantData({
      id: randomUUID(),
      conversationId: conversation.id,
      direction: "outbound",
      type: "text",
      body: params.body,
      providerMessageId,
      providerStatus,
      errorMessage,
      sentByUserId: params.sentByUserId ?? null,
    }),
  });

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return message;
}

export async function sendWhatsAppDocument(params: {
  conversationId: string;
  documentUrl: string;
  fileName?: string;
  body?: string;
  sentByUserId?: string;
  pacienteTelefono?: string | null;
}) {
  const conversation = await prisma.chatConversation.findFirst({
    where: await tenantWhere<Prisma.ChatConversationWhereInput>({ id: params.conversationId }),
    include: { connection: true },
  });
  if (!conversation) throw new Error("Conversación no encontrada");

  const to = normalizePhoneForWhatsApp(params.pacienteTelefono);
  if (!to) throw new Error("El teléfono del paciente no está en formato internacional válido");

  let providerMessageId: string | null = null;
  let providerStatus: Prisma.ChatMessageCreateInput["providerStatus"] = "queued";
  let errorMessage: string | null = null;

  try {
    const response = await sendMetaDocumentMessage({
      phoneNumberId: conversation.connection.phoneNumberId,
      accessToken: conversation.connection.accessTokenEncrypted,
      to,
      documentUrl: params.documentUrl,
      filename: params.fileName,
      caption: params.body,
    });
    providerMessageId = response.messages?.[0]?.id ?? null;
    providerStatus = providerMessageId ? "sent" : "queued";
  } catch (error) {
    providerStatus = "failed";
    errorMessage = error instanceof Error ? error.message : "Error desconocido";
  }

  const message = await prisma.chatMessage.create({
    data: await withTenantData({
      id: randomUUID(),
      conversationId: conversation.id,
      direction: "outbound",
      type: "document",
      body: params.body ?? null,
      mediaUrl: params.documentUrl,
      mediaFileName: params.fileName ?? null,
      providerMessageId,
      providerStatus,
      errorMessage,
      sentByUserId: params.sentByUserId ?? null,
    }),
  });

  await prisma.chatConversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
  return message;
}

export function buildWebhookEventId(payload: unknown): string {
  const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return digest.slice(0, 120);
}
