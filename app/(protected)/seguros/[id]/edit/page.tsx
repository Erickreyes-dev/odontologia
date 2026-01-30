
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getSeguroById } from "../../actions";
import { SeguroFormulario } from "../../components/Form";

export default async function EditSeguro({ params }: { params: { id: string } }) {
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_seguros")) {
    return <NoAcceso />;
  }

  // Obtener el seguro por su ID
  const seguro = await getSeguroById(params.id);
  if (!seguro) {
    redirect("/seguros"); // Redirige si no se encuentra el seguro
  }
  const seguroEdit = {
    id: seguro.id,
    nombre: seguro.nombre,
    activo: seguro.activo,
    descripcion: seguro.descripcion
  };


  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un seguro."
        screenName="Editar Seguro"
      />
      <SeguroFormulario
        isUpdate={true}
        initialData={seguroEdit}
      />
    </div>
  );
}
