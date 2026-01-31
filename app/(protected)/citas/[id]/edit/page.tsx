import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getCitaById } from "../../actions";
import { CitaFormulario } from "../../components/Form";
import { getPacientesActivos } from "@/app/(protected)/pacientes/actions";
import { getMedicosActivos } from "@/app/(protected)/medicos/actions";
import { getConsultoriosActios } from "@/app/(protected)/consultorios/actions";

export default async function EditCitaPage({
  params,
}: {
  params: { id: string };
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_citas")) {
    return <NoAcceso />;
  }

  const [cita, pacientes, medicos, consultorios] = await Promise.all([
    getCitaById(params.id),
    getPacientesActivos(),
    getMedicosActivos(),
    getConsultoriosActios(),
  ]);

  if (!cita) {
    redirect("/citas");
  }

  const citaEdit = {
    id: cita.id,
    pacienteId: cita.pacienteId,
    medicoId: cita.medicoId,
    consultorioId: cita.consultorioId,
    fechaHora: cita.fechaHora,
    estado: cita.estado,
    motivo: cita.motivo,
    observacion: cita.observacion,
  };

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podra editar una cita existente."
        screenName="Editar Cita"
      />
      <CitaFormulario
        isUpdate={true}
        initialData={citaEdit}
        pacientes={pacientes}
        medicos={medicos}
        consultorios={consultorios}
      />
    </div>
  );
}
