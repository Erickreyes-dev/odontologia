import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { FileText } from "lucide-react";
import { CotizacionFormulario } from "../components/Form";
import { getPacientesActivos } from "../../pacientes/actions";
import { getServiciosActivos } from "../actions";

export default async function Create() {
  const permisos = await getSessionPermisos();

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
      />
    </div>
  );
}
