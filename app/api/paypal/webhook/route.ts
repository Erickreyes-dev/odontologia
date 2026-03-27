import { NextResponse } from "next/server";
import { finalizeOnboardingProvision } from "@/lib/onboarding-payment";

type PaypalWebhookEvent = {
  event_type?: string;
  resource?: {
    id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  try {
    const payload = await request.json() as PaypalWebhookEvent;
    const eventType = payload.event_type ?? "";

    if (!["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED"].includes(eventType)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const orderId = payload.resource?.supplementary_data?.related_ids?.order_id || payload.resource?.id;
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "order_id no recibido" }, { status: 400 });
    }

    const result = await finalizeOnboardingProvision(orderId);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo procesar webhook" },
      { status: 500 },
    );
  }
}
