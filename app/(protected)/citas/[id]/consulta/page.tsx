import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getCitaParaConsulta,
  getConsultaByCitaId,
  getProductosActivos,
  getPromocionesActivas,
  getServiciosActivos,
} from "./actions";
import HeaderComponent from "@/components/HeaderComponent";
import { Calendar } from "lucide-react";
import { getSeguimientosPendientes } from "@/app/(protected)/planes-tratamiento/actions";
import { getFinanciamientosPorPaciente } from "@/app/(protected)/pagos/actions";

interface ConsultaPageProps {
  params: Promise<{ id: string }>;
}

const ConsultaForm = dynamic(
  () => import("./components/ConsultaForm").then((mod) => mod.ConsultaForm),
  {
    ssr: false,
    loading: () => <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">Cargando formulario de consulta...</div>,
  }
);

export default async function ConsultaPage({
 params }: ConsultaPageProps) {
  const { id } = await params;
  
  const [cita, consulta] = await Promise.all([
    getCitaParaConsulta(id),
    getConsultaByCitaId(id),
  ]);

  if (!cita) {
    notFound();
  }

  const [servicios, productos, seguimientos, financiamientos, promociones] = await Promise.all([
    getServiciosActivos(),
    getProductosActivos(),
    cita.paciente?.id ? getSeguimientosPendientes(cita.paciente.id) : Promise.resolve([]),
    cita.paciente?.id ? getFinanciamientosPorPaciente(cita.paciente.id) : Promise.resolve([]),
    getPromocionesActivas(),
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
        seguimientos={seguimientos.map(s => ({ ...s, id: s.id ?? '' }))}
        financiamientos={financiamientos}
        promociones={promociones}
      />
    </div>
  );
}
