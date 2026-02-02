import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ClipboardList } from "lucide-react";
import { PlanFormulario } from "../components/Form";
import { getPacientesActivos } from "../../pacientes/actions";
import { getServiciosActivos } from "../actions";
import { getMedicosActivos } from "../../medicos/actions";

interface CreatePageProps {
  searchParams: Promise<{ pacienteId?: string }>;
}

export default async function Create({ searchParams }: CreatePageProps) {
  const permisos = await getSessionPermisos();
  const { pacienteId } = await searchParams;

  if (!permisos?.includes("crear_planes_tratamiento")) {
    return <NoAcceso />;
  }

  const [pacientes, servicios, medicos] = await Promise.all([
    getPacientesActivos(),
    getServiciosActivos(),
    getMedicosActivos(),
  ]);

  return (
    <div>
      <HeaderComponent
        Icon={ClipboardList}
        description="En este apartado podrá crear un nuevo plan de tratamiento."
        screenName="Crear Plan de Tratamiento"
      />
      <PlanFormulario
        isUpdate={false}
        pacientes={pacientes}
        servicios={servicios}
        medicos={medicos}
        defaultPacienteId={pacienteId}
      />
    </div>
  );
}
