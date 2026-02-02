import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { FileText } from "lucide-react";
import { CotizacionFormulario } from "../components/Form";
import { getPacientesActivos } from "../../pacientes/actions";
import { getServiciosActivos } from "../actions";

interface CreatePageProps {
  searchParams: Promise<{ pacienteId?: string }>;
}

export default async function Create({ searchParams }: CreatePageProps) {
  const permisos = await getSessionPermisos();
  const { pacienteId } = await searchParams;

  if (!permisos?.includes("crear_cotizaciones")) {
    return <NoAcceso />;
  }

  const [pacientes, servicios] = await Promise.all([
    getPacientesActivos(),
    getServiciosActivos(),
  ]);

  return (
    <div>
      <HeaderComponent
        Icon={FileText}
        description="En este apartado podrá crear una nueva cotización."
        screenName="Crear Cotización"
      />
      <CotizacionFormulario
        isUpdate={false}
        pacientes={pacientes}
        servicios={servicios}
        defaultPacienteId={pacienteId}
      />
    </div>
  );
}
