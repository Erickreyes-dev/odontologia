import { MessageCircleMore } from "lucide-react";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { getSessionPermisos } from "@/auth";
import { getTenantWhatsappConfig } from "./actions";
import { WhatsappConfigForm } from "./components/whatsapp-config-form";

export default async function WhatsappConfigPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_tenant")) {
    return <NoAcceso />;
  }

  const config = await getTenantWhatsappConfig();
  if (!config) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={MessageCircleMore}
        screenName="WhatsApp Business"
        description="Conecta Twilio para recibir mensajes, registrar solicitudes de citas y enviar respuestas por WhatsApp."
      />
      <WhatsappConfigForm config={config} />
    </div>
  );
}
