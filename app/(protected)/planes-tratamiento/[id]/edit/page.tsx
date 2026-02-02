import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";
import { PlanFormulario } from "../../components/Form";
import { getPlanById, getServiciosActivos } from "../../actions";
import { getPacientesActivos } from "../../../pacientes/actions";
import { getMedicosActivos } from "../../../medicos/actions";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function Edit({ params }: EditPageProps) {
  const { id } = await params;
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_planes_tratamiento")) {
    return <NoAcceso />;
  }

  const [plan, pacientes, servicios, medicos] = await Promise.all([
    getPlanById(id),
    getPacientesActivos(),
    getServiciosActivos(),
    getMedicosActivos(),
  ]);

  if (!plan) {
    redirect("/planes-tratamiento");
  }

  // No permitir editar planes completados o cancelados
  if (plan.estado === "COMPLETADO" || plan.estado === "CANCELADO") {
    redirect(`/planes-tratamiento/${id}`);
  }

  return (
    <div>
      <HeaderComponent
        Icon={ClipboardList}
        description="En este apartado podrá editar el plan de tratamiento."
        screenName="Editar Plan de Tratamiento"
      />
      <PlanFormulario
        isUpdate={true}
        initialData={plan}
        pacientes={pacientes}
        servicios={servicios}
        medicos={medicos}
      />
    </div>
  );
}
