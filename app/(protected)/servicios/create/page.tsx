import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ListCheck } from "lucide-react";
import { FormularioServicio } from "../components/form";
import { getMedicosActivos } from "../../medicos/actions";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function CreateServicioPage() {
  void dynamic;
  await requireActiveSubscription();

  const permisos = await getSessionPermisos();
  if (!permisos?.includes("crear_medicos") && !permisos?.includes("crear_servicios")) {
    return <NoAcceso />;
  }

  // Traemos todos los médicos para mostrarlos en el checkbox


  const medicos = await getMedicosActivos();
  console.log("🚀 ~ CreateServicioPage ~ medicos:", medicos)

  return (
    <div className="container mx-auto py-4">
      <HeaderComponent
        Icon={ListCheck}
        description="Aquí puede crear un nuevo servicio"
        screenName="Crear Servicio"
      />
      <FormularioServicio isUpdate={false} medicosDisponibles={medicos} />
    </div>
  );
}
