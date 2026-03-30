import { getSession } from "@/auth";
import { completeMetaConnection } from "@/lib/whatsapp/service";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.TenantId) {
    return Response.redirect(new URL("/", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // En embedded signup podemos recibir estos assets en query o re-consultarse en fase 2.
  const businessId = searchParams.get("business_id") ?? "pending_business";
  const wabaId = searchParams.get("waba_id") ?? "pending_waba";
  const phoneNumberId = searchParams.get("phone_number_id") ?? "pending_phone";

  if (!code || !state) {
    return Response.redirect(new URL("/whatsapp?status=error", request.url));
  }

  try {
    await completeMetaConnection({
      code,
      state,
      expectedTenantId: session.TenantId,
      businessId,
      wabaId,
      phoneNumberId,
      displayPhoneNumber: searchParams.get("display_phone_number") ?? undefined,
      verifiedName: searchParams.get("verified_name") ?? undefined,
    });
  } catch {
    return Response.redirect(new URL("/whatsapp?status=error", request.url));
  }

  redirect("/whatsapp?status=connected");
}
