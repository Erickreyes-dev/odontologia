const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export type EmbeddedSignupPayload = {
  code?: string;
  business_id?: string;
  businessAccountId?: string;
  phone_number_id?: string;
  phoneNumberId?: string;
  waba_id?: string;
  wabaId?: string;
  data?: {
    business_id?: string;
    phone_number_id?: string;
    waba_id?: string;
  };
  [key: string]: unknown;
};

type MetaTokenResponse = {
  access_token?: string;
  error?: { message?: string };
};

export type MetaPhoneNumber = {
  id: string;
  verified_name?: string;
  display_phone_number?: string;
  quality_rating?: string;
  messaging_limit_tier?: string;
};

function getMetaAppCredentials() {
  const appId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Configura META_APP_ID y META_APP_SECRET para completar Embedded Signup.");
  }

  return { appId, appSecret };
}

export function getRequiredMetaSystemUserToken() {
  const token = process.env.META_SYSTEM_USER_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Configura META_SYSTEM_USER_ACCESS_TOKEN para consultar y operar WhatsApp Cloud API.");
  }
  return token;
}

export function normalizeEmbeddedSignupPayload(payload: EmbeddedSignupPayload) {
  const businessAccountId = payload.businessAccountId || payload.business_id || payload.data?.business_id;
  const phoneNumberId = payload.phoneNumberId || payload.phone_number_id || payload.data?.phone_number_id;
  const wabaId = payload.wabaId || payload.waba_id || payload.data?.waba_id;

  if (!businessAccountId || !phoneNumberId || !wabaId) {
    throw new Error("Meta no devolvió businessAccountId, phoneNumberId o wabaId.");
  }

  return {
    businessAccountId: String(businessAccountId),
    phoneNumberId: String(phoneNumberId),
    wabaId: String(wabaId),
  };
}

export async function exchangeEmbeddedSignupCode(code: string) {
  const { appId, appSecret } = getMetaAppCredentials();
  const url = new URL(`${META_GRAPH_BASE_URL}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code);

  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json()) as MetaTokenResponse;

  if (!response.ok || !body.access_token) {
    throw new Error(body.error?.message || "No se pudo intercambiar el código de Meta.");
  }

  return body.access_token;
}

export async function fetchMetaPhoneNumber(phoneNumberId: string, accessToken = getRequiredMetaSystemUserToken()) {
  const url = new URL(`${META_GRAPH_BASE_URL}/${phoneNumberId}`);
  url.searchParams.set("fields", "id,verified_name,display_phone_number,quality_rating,messaging_limit_tier");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json()) as MetaPhoneNumber & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(body.error?.message || "No se pudo consultar el número de WhatsApp en Meta.");
  }

  return body;
}

type MetaSendMessageResponse = {
  messages?: Array<{ id?: string }>;
  error?: { message?: string };
};

export function normalizeWhatsappRecipientPhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\D/g, "");
}

export async function sendWhatsappTextMessage({
  phoneNumberId,
  to,
  body,
  accessToken = getRequiredMetaSystemUserToken(),
}: {
  phoneNumberId: string;
  to: string;
  body: string;
  accessToken?: string;
}) {
  const recipient = normalizeWhatsappRecipientPhone(to);
  if (!recipient) {
    throw new Error("El número de destino es requerido para enviar WhatsApp.");
  }

  const response = await fetch(`${META_GRAPH_BASE_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: { preview_url: false, body },
    }),
  });
  const payload = (await response.json()) as MetaSendMessageResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || "No se pudo enviar el mensaje por WhatsApp.");
  }

  return payload;
}
