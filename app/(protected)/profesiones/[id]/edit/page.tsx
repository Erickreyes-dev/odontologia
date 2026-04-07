
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getProfesionById } from "../../actions";
import { ProfesionFormulario } from "../../components/Form";

export default async function EditProfesion({
 params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_profesiones")) {
    return <NoAcceso />;
  }

  // Obtener la profesion por su ID
  const profesion = await getProfesionById(params.id);
  if (!profesion) {
    redirect("/profesiones"); // Redirige si no se encuentra la profesion
  }
  const profesionEdit = {
    id: profesion.id,
    nombre: profesion.nombre,
    activo: profesion.activo,
    descripcion: profesion.descripcion
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar una profesión."
        screenName="Editar profesión"
      />
      <ProfesionFormulario
        isUpdate={true}
        initialData={profesionEdit}
      />
    </div>
  );
}
