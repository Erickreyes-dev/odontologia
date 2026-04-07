import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Building2 } from "lucide-react";
import { getSessionPermisos } from "@/auth";
import MiClinicaForm from "./components/mi-clinica-form";
import { getTenantClinicProfile } from "./actions";

export default async function MiClinicaPage() {

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_profile")) {
    return <NoAcceso />;
  }

  const tenant = await getTenantClinicProfile();
  if (!tenant) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={Building2}
        description="Configura la información de tu clínica que se mostrará en la landing pública de tu subdominio."
        screenName="Mi Clínica"
      />
      <MiClinicaForm tenant={tenant} canEdit={permisos.includes("editar_tenant")} />
    </div>
  );
}
