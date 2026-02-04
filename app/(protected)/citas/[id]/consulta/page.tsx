import { notFound } from "next/navigation";
import {
  getCitaParaConsulta,
  getConsultaByCitaId,
  getProductosActivos,
  getServiciosActivos,
} from "./actions";
import HeaderComponent from "@/components/HeaderComponent";
import { ConsultaForm } from "./components/ConsultaForm";
import { Calendar } from "lucide-react";
import { getSeguimientosPendientes } from "@/app/(protected)/planes-tratamiento/actions";
import { getFinanciamientosPorPaciente } from "@/app/(protected)/pagos/actions";

interface ConsultaPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConsultaPage({ params }: ConsultaPageProps) {
  const { id } = await params;
  
  const [cita, consulta] = await Promise.all([
    getCitaParaConsulta(id),
    getConsultaByCitaId(id),
  ]);

  if (!cita) {
    notFound();
  }

  const [servicios, productos, seguimientos, financiamientos] = await Promise.all([
    getServiciosActivos(),
    getProductosActivos(),
    cita.paciente?.id ? getSeguimientosPendientes(cita.paciente.id) : Promise.resolve([]),
    cita.paciente?.id ? getFinanciamientosPorPaciente(cita.paciente.id) : Promise.resolve([]),
  ]);

  return (
    <div className="container mx-auto py-6">
      <HeaderComponent
        Icon={Calendar}
        screenName="Consulta Medica"
        description={`Paciente: ${cita.paciente?.nombre} ${cita.paciente?.apellido} | ${cita.paciente?.identidad}`}
        // breadcrumbs={[
        //   { label: "Inicio", href: "/" },
        //   { label: "Citas", href: "/citas" },
        //   { label: "Consulta", href: `/citas/${id}/consulta` },
        // ]}
      />

      <ConsultaForm
        cita={cita}
        consulta={consulta}
        servicios={servicios}
        productos={productos}
        seguimientos={seguimientos}
        financiamientos={financiamientos}
      />
    </div>
  );
}
