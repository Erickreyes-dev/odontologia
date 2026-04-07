import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { CalendarPlus } from "lucide-react";
import { CitaFormulario } from "../components/Form";
import { getSeguimientoContextoParaCita } from "../actions";
import { getPacientesActivos } from "../../pacientes/actions";
import { getMedicosActivos } from "../../medicos/actions";
import { getConsultoriosActios } from "../../consultorios/actions";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function CreateCitaPage({

  searchParams,
}: {
  searchParams: { pacienteId?: string; seguimientoId?: string };
}) {
  void dynamic;
  await requireActiveSubscription();
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_citas")) {
    return <NoAcceso />;
  }

  const seguimientoContexto = searchParams.seguimientoId
    ? await getSeguimientoContextoParaCita(searchParams.seguimientoId)
    : null;

  const [pacientes, medicos, consultorios] = await Promise.all([
    getPacientesActivos(),
    getMedicosActivos(),
    getConsultoriosActios(),
  ]);

  const pacienteId = seguimientoContexto?.pacienteId || searchParams.pacienteId || "";

  const initialData = {
    id: "",
    pacienteId,
    medicoId: "",
    consultorioId: "",
    fechaHora: new Date(),
    estado: "programada",
    motivo: seguimientoContexto?.motivo || "",
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
        defaultPacienteId={pacienteId}
      />
    </div>
  );
}
