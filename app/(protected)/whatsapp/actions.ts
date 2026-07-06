"use server";

import { getSessionPermisos } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { Prisma } from "@/lib/generated/prisma";
import {
  EmbeddedSignupPayload,
  exchangeEmbeddedSignupCode,
  fetchMetaPhoneNumber,
  normalizeEmbeddedSignupPayload,
} from "@/lib/meta-whatsapp";
import { revalidatePath } from "next/cache";

async function assertCanEditWhatsapp() {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_tenant")) {
    throw new Error("No tienes permiso para configurar WhatsApp.");
  }
}

export async function getWhatsappConnection() {
  const { tenantId } = await getTenantContext();
  return prisma.whatsappConnection.findFirst({
    where: { tenantId, status: { not: "deleted" } },
    orderBy: { updateAt: "desc" },
  });
}

export async function completeWhatsappEmbeddedSignup(payload: EmbeddedSignupPayload) {
  await assertCanEditWhatsapp();
  const { tenantId } = await getTenantContext();
  const normalized = normalizeEmbeddedSignupPayload(payload);
  const tokenForLookup = payload.code ? await exchangeEmbeddedSignupCode(payload.code) : undefined;
  const phone = await fetchMetaPhoneNumber(normalized.phoneNumberId, tokenForLookup);

  await prisma.whatsappConnection.upsert({
    where: {
      tenantId_phoneNumberId: {
        tenantId,
        phoneNumberId: normalized.phoneNumberId,
      },
    },
    create: {
      tenantId,
      businessAccountId: normalized.businessAccountId,
      wabaId: normalized.wabaId,
      phoneNumberId: normalized.phoneNumberId,
      displayPhone: phone.display_phone_number,
      verifiedName: phone.verified_name,
      qualityRating: phone.quality_rating,
      messagingLimit: phone.messaging_limit_tier,
      status: "connected",
      rawSignupPayload: payload as Prisma.InputJsonValue,
      rawPhonePayload: phone as Prisma.InputJsonValue,
    },
    update: {
      businessAccountId: normalized.businessAccountId,
      wabaId: normalized.wabaId,
      displayPhone: phone.display_phone_number,
      verifiedName: phone.verified_name,
      qualityRating: phone.quality_rating,
      messagingLimit: phone.messaging_limit_tier,
      status: "connected",
      disconnectedAt: null,
      connectedAt: new Date(),
      rawSignupPayload: payload as Prisma.InputJsonValue,
      rawPhonePayload: phone as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function disconnectWhatsappConnection() {
  await assertCanEditWhatsapp();
  const { tenantId } = await getTenantContext();

  await prisma.whatsappConnection.updateMany({
    where: { tenantId, status: "connected" },
    data: { status: "disconnected", disconnectedAt: new Date() },
  });

  revalidatePath("/whatsapp");
  return { ok: true };
}
