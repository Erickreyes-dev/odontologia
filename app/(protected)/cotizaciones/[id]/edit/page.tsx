import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getCotizacionById, getServiciosActivos } from "../../actions";
import { CotizacionFormulario } from "../../components/Form";
import { getPacientesActivos } from "../../../pacientes/actions";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function EditCotizacion({

  params,
}: {
  params: Promise<{ id: string }>;
}) {
  void dynamic;
  await requireActiveSubscription();
  const { id } = await params;
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_cotizaciones")) {
    return <NoAcceso />;
  }

  const [cotizacion, pacientes, servicios] = await Promise.all([
    getCotizacionById(id),
    getPacientesActivos(),
    getServiciosActivos(),
  ]);

  if (!cotizacion) {
    redirect("/cotizaciones");
  }

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar una cotización."
        screenName="Editar Cotización"
      />
      <CotizacionFormulario
        isUpdate={true}
        initialData={cotizacion}
        pacientes={pacientes}
        servicios={servicios}
      />
    </div>
  );
}
