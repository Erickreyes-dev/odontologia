import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { getSessionPermisos } from "@/auth";
import { MessageCircle } from "lucide-react";
import { getWhatsappConnection } from "./actions";
import { WhatsappSettingsClient } from "./components/whatsapp-settings-client";

export default async function WhatsappPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_tenant")) {
    return <NoAcceso />;
  }

  const connection = await getWhatsappConnection();

  return (
    <div className="container mx-auto space-y-4 py-2">
      <HeaderComponent
        Icon={MessageCircle}
        description="Conecta la clínica con WhatsApp Cloud API mediante Embedded Signup de Meta para comunicarte con tus pacientes sin copiar credenciales manualmente."
        screenName="WhatsApp"
      />
      <WhatsappSettingsClient
        appId={process.env.NEXT_PUBLIC_META_APP_ID || ""}
        configId={process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID || ""}
        graphVersion={process.env.NEXT_PUBLIC_META_GRAPH_VERSION || process.env.META_GRAPH_VERSION || "v21.0"}
        connection={connection ? {
          businessAccountId: connection.businessAccountId,
          wabaId: connection.wabaId,
          phoneNumberId: connection.phoneNumberId,
          displayPhone: connection.displayPhone,
          verifiedName: connection.verifiedName,
          qualityRating: connection.qualityRating,
          messagingLimit: connection.messagingLimit,
          status: connection.status,
          connectedAt: connection.connectedAt.toISOString(),
        } : null}
      />
    </div>
  );
}
