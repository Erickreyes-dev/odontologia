import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import {  ShieldPlus } from "lucide-react";
import { SeguroFormulario } from "../components/Form";

export default async function Create() {
  const permisos = await getSessionPermisos();

  // Verifica permisos para crear puestos
  if (!permisos?.includes("crear_seguros")) {
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
        Icon={ShieldPlus}
        description="En este apartado podrá crear un seguro."
        screenName="Crear Seguro"
      />
      <SeguroFormulario
        isUpdate={false}
        initialData={initialData}
      />
    </div>
  );
}
