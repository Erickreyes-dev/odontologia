import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { MessageCircle } from "lucide-react";
import { getSessionPermisos } from "@/auth";
import { getWhatsappModuleData } from "./actions";
import WhatsappChatClient from "./components/whatsapp-chat-client";

export default async function WhatsappModulePage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pacientes")) {
    return <NoAcceso />;
  }

  const data = await getWhatsappModuleData();

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={MessageCircle}
        screenName="WhatsApp"
        description="Chat manual con pacientes y seguimiento de conversaciones por clínica."
      />
      <WhatsappChatClient
        enabled={data.enabled}
        estado={data.estado}
        pacientes={data.pacientes}
        threads={data.threads}
        messages={data.messages}
      />
    </div>
  );
}
