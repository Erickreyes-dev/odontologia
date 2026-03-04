import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { User } from "lucide-react";
import { redirect } from "next/navigation";
import { getConstanciasMedicasByPaciente, getPacienteById } from "../../actions";
import { getCitasByPaciente } from "@/app/(protected)/citas/actions";
import { getCotizacionesByPaciente } from "@/app/(protected)/cotizaciones/actions";
import { getPlanesByPaciente } from "@/app/(protected)/planes-tratamiento/actions";
import { getFinanciamientosPorPaciente, getPagosByPaciente } from "@/app/(protected)/pagos/actions";
import { PacientePerfil } from "./components/paciente-perfil";
import { getSegurosActivos } from "@/app/(protected)/seguros/actions";
import { prisma } from "@/lib/prisma";

export default async function PacientePerfilPage({
  params,
}: {
  params: { id: string };
}) {
  const permisos = await getSessionPermisos();
  const session = await getSession();

  if (!permisos?.includes("ver_pacientes")) {
    return <NoAcceso />;
  }

  const [paciente, citas, cotizaciones, planes, pagos, financiamientos, seguros, constancias] = await Promise.all([
    getPacienteById(params.id),
    getCitasByPaciente(params.id),
    getCotizacionesByPaciente(params.id),
    getPlanesByPaciente(params.id),
    getPagosByPaciente(params.id),
    getFinanciamientosPorPaciente(params.id),
    getSegurosActivos(),
    getConstanciasMedicasByPaciente(params.id),
  ]);

  if (!paciente) {
    redirect("/pacientes");
  }

  // Find the seguro name if the patient has one
  const seguro = paciente.seguroId 
    ? seguros.find(s => s.id === paciente.seguroId) 
    : null;

  const tenantContactInfo = session?.TenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.TenantId },
        select: { contactoCorreo: true, telefono: true },
      })
    : null;

  const clinicInfo = {
    nombre: session?.TenantNombre ?? "Clinica",
    correo: tenantContactInfo?.contactoCorreo ?? null,
    telefono: tenantContactInfo?.telefono ?? null,
  };

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
        planes={planes}
        pagos={pagos}
        financiamientos={financiamientos}
        seguroNombre={seguro?.nombre}
        clinicInfo={clinicInfo}
        constancias={constancias}
      />
    </div>
  );
}
