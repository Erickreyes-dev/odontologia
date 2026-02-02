import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { User } from "lucide-react";
import { redirect } from "next/navigation";
import { getPacienteById } from "../../actions";
import { getCitasByPaciente } from "@/app/(protected)/citas/actions";
import { getCotizacionesByPaciente } from "@/app/(protected)/cotizaciones/actions";
import { PacientePerfil } from "./components/paciente-perfil";
import { getSegurosActivos } from "@/app/(protected)/seguros/actions";

export default async function PacientePerfilPage({
  params,
}: {
  params: { id: string };
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pacientes")) {
    return <NoAcceso />;
  }

  const [paciente, citas, cotizaciones, seguros] = await Promise.all([
    getPacienteById(params.id),
    getCitasByPaciente(params.id),
    getCotizacionesByPaciente(params.id),
    getSegurosActivos(),
  ]);

  if (!paciente) {
    redirect("/pacientes");
  }

  // Find the seguro name if the patient has one
  const seguro = paciente.seguroId 
    ? seguros.find(s => s.id === paciente.seguroId) 
    : null;

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={User}
        description="Perfil del paciente con su informacion y citas."
        screenName="Perfil del Paciente"
      />
      <PacientePerfil 
        paciente={paciente} 
        citas={citas} 
        cotizaciones={cotizaciones}
        seguroNombre={seguro?.nombre}
      />
    </div>
  );
}
