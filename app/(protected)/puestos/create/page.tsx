import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { PuestoFormulario } from "../components/Form";

export default async function Create() {
  const permisos = await getSessionPermisos();

  // Verifica permisos para crear puestos
  if (!permisos?.includes("crear_puestos")) {
    return <NoAcceso />;
  }

  // Inicializamos con un valor específico para puesto
  const initialData = {
    nombre: "",
    descripcion: "",
    id: "",
    activo: true,
  };

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear un puesto."
        screenName="Crear Puesto"
      />
      <PuestoFormulario
        isUpdate={false}
        initialData={initialData}
      />
    </div>
  );
}
