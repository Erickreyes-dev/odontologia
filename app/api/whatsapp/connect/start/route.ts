import { requireTenantPermission } from "@/lib/authorization";
import { buildMetaConnectUrl } from "@/lib/whatsapp/service";

export async function POST() {
  await requireTenantPermission("configurar_whatsapp");
  try {
    const result = await buildMetaConnectUrl();
    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "No se pudo iniciar la conexión" },
      { status: 400 }
    );
  }
}
