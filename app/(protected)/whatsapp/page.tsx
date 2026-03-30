import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { MessageCircle } from "lucide-react";
import { getWhatsAppDashboardData } from "./actions";
import { WhatsAppDashboard } from "./components/whatsapp-dashboard";

export default async function WhatsAppPage() {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("ver_whatsapp")) {
    return <NoAcceso />;
  }

  const data = await getWhatsAppDashboardData();

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={MessageCircle}
        description="Administra conexión, estado y mensajería de WhatsApp Business por clínica."
        screenName="WhatsApp"
      />
      <WhatsAppDashboard {...data} />
    </div>
  );
}
