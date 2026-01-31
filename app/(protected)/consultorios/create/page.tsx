import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import {  ShieldPlus } from "lucide-react";
import { ConsultorioFormulario } from "../components/Form";

export default async function Create() {
  const permisos = await getSessionPermisos();

  // Verifica permisos para crear puestos
  if (!permisos?.includes("crear_consultorios")) {
    return <NoAcceso />;
  }

  // Inicializamos con un valor específico para puesto
  const initialData = {
    nombre: "",
    ubicacion: "",
    id: "",
    activo: true,
  };

  return (
    <div>
      <HeaderComponent
        Icon={ShieldPlus}
        description="En este apartado podrá crear un consultorio."
        screenName="Crear consultorio"
      />
      <ConsultorioFormulario
        isUpdate={false}
        initialData={initialData}
      />
    </div>
  );
}
