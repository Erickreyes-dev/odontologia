import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { CalendarPlus } from "lucide-react";
import { CitaFormulario } from "../components/Form";
import { getPacientesActivos } from "../../pacientes/actions";
import { getMedicosActivos } from "../../medicos/actions";
import { getConsultoriosActios } from "../../consultorios/actions";

export default async function CreateCitaPage({
  searchParams,
}: {
  searchParams: { pacienteId?: string };
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_citas")) {
    return <NoAcceso />;
  }

  const [pacientes, medicos, consultorios] = await Promise.all([
    getPacientesActivos(),
    getMedicosActivos(),
    getConsultoriosActios(),
  ]);

  const initialData = {
    id: "",
    pacienteId: searchParams.pacienteId || "",
    medicoId: "",
    consultorioId: "",
    fechaHora: new Date(),
    estado: "programada",
    motivo: "",
    observacion: "",
  };

  return (
    <div>
      <HeaderComponent
        Icon={CalendarPlus}
        description="En este apartado podra crear una nueva cita."
        screenName="Crear Cita"
      />
      <CitaFormulario
        isUpdate={false}
        initialData={initialData}
        pacientes={pacientes}
        medicos={medicos}
        consultorios={consultorios}
        defaultPacienteId={searchParams.pacienteId}
      />
    </div>
  );
}
