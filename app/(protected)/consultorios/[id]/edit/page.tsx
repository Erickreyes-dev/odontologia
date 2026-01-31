
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getConsultorioById } from "../../actions";
import { ConsultorioFormulario } from "../../components/Form";

export default async function EditConsultorio({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_consultorios")) {
    return <NoAcceso />;
  }

  // Obtener el consultorio por su ID
  const consultorio = await getConsultorioById(params.id);
  if (!consultorio) {
    redirect("/consultorios"); // Redirige si no se encuentra el consultorio
  }
  const consultorioEdit = {
    id: consultorio.id,
    nombre: consultorio.nombre,
    activo: consultorio.activo,
    ubicacion: consultorio.ubicacion
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un consultorio."
        screenName="Editar consultorio"
      />
      <ConsultorioFormulario
        isUpdate={true}
        initialData={consultorioEdit}
      />
    </div>
  );
}
