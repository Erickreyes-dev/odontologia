import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MetaWebhookEntry = {
  id?: string;
  changes?: Array<{
    field?: string;
    value?: {
      metadata?: { phone_number_id?: string; display_phone_number?: string };
      statuses?: Array<{ id?: string; status?: string; timestamp?: string; recipient_id?: string }>;
      messages?: Array<{ id?: string; from?: string; timestamp?: string; type?: string }>;
      [key: string]: unknown;
    };
  }>;
};

type MetaWebhookPayload = {
  object?: string;
  entry?: MetaWebhookEntry[];
  [key: string]: unknown;
};

function getVerifyToken() {
  return process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "";
}

function getAppSecret() {
  return process.env.META_APP_SECRET || "";
}

function verifySignature(rawBody: string, signatureHeader: string | null) {
  const appSecret = getAppSecret();
  if (!appSecret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === getVerifyToken() && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook de Meta no verificado." }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida de Meta." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as MetaWebhookPayload;
  const events = summarizeWebhookPayload(payload);

  if (events.length) {
    console.info("Meta WhatsApp webhook recibido", events);
  }

  return NextResponse.json({ received: true });
}

function summarizeWebhookPayload(payload: MetaWebhookPayload) {
  const entries = payload.entry?.length ? payload.entry : [];

  return entries.flatMap((entry) =>
    (entry.changes?.length ? entry.changes : []).map((change) => {
      const phoneNumberId = change.value?.metadata?.phone_number_id ?? null;
      const message = change.value?.messages?.[0];
      const status = change.value?.statuses?.[0];

      return {
        wabaId: entry.id ?? null,
        phoneNumberId,
        field: change.field ?? null,
        eventType: message ? "message" : status ? "status" : change.field || "unknown",
        metaMessageId: message?.id || status?.id || null,
        messageStatus: status?.status || null,
      };
    })
  );
}
