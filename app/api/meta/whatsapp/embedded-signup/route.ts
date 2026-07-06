import { NextResponse } from "next/server";
import { completeWhatsappEmbeddedSignup } from "@/app/(protected)/whatsapp/actions";
import { EmbeddedSignupPayload } from "@/lib/meta-whatsapp";

export async function POST(request: Request) {
  const payload = (await request.json()) as EmbeddedSignupPayload;
  const result = await completeWhatsappEmbeddedSignup(payload);
  return NextResponse.json(result);
}
