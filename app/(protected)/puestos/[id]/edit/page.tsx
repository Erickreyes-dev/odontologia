
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getPuestoById } from "../../actions";
import { PuestoFormulario } from "../../components/Form";

export default async function Edit({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_puestos")) {
    return <NoAcceso />;
  }

  // Obtener el puesto por su ID
  const puesto = await getPuestoById(params.id);
  if (!puesto) {
    redirect("/puestos"); // Redirige si no se encuentra el puesto
  }
  const puestoCreate = {
    id: puesto.id,
    nombre: puesto.nombre,
    activo: puesto.activo,
    descripcion: puesto.descripcion
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un puesto."
        screenName="Editar Puesto"
      />
      <PuestoFormulario
        isUpdate={true}
        initialData={puestoCreate}
      />
    </div>
  );
}
