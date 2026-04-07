import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ListCheck } from "lucide-react";
import { getServicioById } from "../../actions";
import { FormularioServicio } from "../../components/form";
import { getMedicosActivos } from "@/app/(protected)/medicos/actions";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

interface Props {
  params: { id: string };
}

export default async function EditServicioPage({
 params }: Props) {
  void dynamic;
  await requireActiveSubscription();
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_medicos") && !permisos?.includes("editar_servicios")) {
    return <NoAcceso />;
  }

  const servicio = await getServicioById(params.id);
  if (!servicio) return <p>Servicio no encontrado</p>;

  // Traemos todos los médicos disponibles
  const medicos = await getMedicosActivos();

  return (
    <div className="container mx-auto py-4">
      <HeaderComponent
        Icon={ListCheck}
        description="Aquí puede editar un servicio existente"
        screenName="Editar Servicio"
      />
      <FormularioServicio
        isUpdate={true}
        initialData={servicio}
        medicosDisponibles={medicos}
      />
    </div>
  );
}
