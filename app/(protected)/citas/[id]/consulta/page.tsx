import { notFound } from "next/navigation";
import { getCitaParaConsulta, getConsultaByCitaId, getProductosDisponibles, getServiciosDisponibles } from "./actions";
import HeaderComponent from "@/components/HeaderComponent";
import { ConsultaForm } from "./components/ConsultaForm";
import { Calendar } from "lucide-react";

interface ConsultaPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConsultaPage({ params }: ConsultaPageProps) {
  const { id } = await params;
  
  const [cita, consulta, servicios, productos] = await Promise.all([
    getCitaParaConsulta(id),
    getConsultaByCitaId(id),
    getServiciosDisponibles(),
    getProductosDisponibles(),
  ]);

  if (!cita) {
    notFound();
  }

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
      />
    </div>
  );
}
