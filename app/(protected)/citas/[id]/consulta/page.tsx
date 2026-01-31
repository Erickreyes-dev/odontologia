import { notFound } from "next/navigation";
import { getCitaParaConsulta, getConsultaByCitaId, getServiciosDisponibles } from "./actions";
import HeaderComponent from "@/components/HeaderComponent";
import { ConsultaForm } from "./components/ConsultaForm";

interface ConsultaPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConsultaPage({ params }: ConsultaPageProps) {
  const { id } = await params;
  
  const [cita, consulta, servicios] = await Promise.all([
    getCitaParaConsulta(id),
    getConsultaByCitaId(id),
    getServiciosDisponibles(),
  ]);

  if (!cita) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <HeaderComponent
        title="Consulta Medica"
        description={`Paciente: ${cita.paciente?.nombre} ${cita.paciente?.apellido} | ${cita.paciente?.identidad}`}
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Citas", href: "/citas" },
          { label: "Consulta", href: `/citas/${id}/consulta` },
        ]}
      />

      <ConsultaForm 
        cita={cita}
        consulta={consulta}
        servicios={servicios}
      />
    </div>
  );
}
