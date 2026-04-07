
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ListCheck } from "lucide-react";
import { DataTable } from "./components/data-table"; // Tu componente DataTable
import { getSessionPermisos } from "@/auth";
import { getServicios } from "./actions";
import { columns } from "./components/columns";
import ServicioListMobile from "./components/servicio-list-mobile";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function VerServiciosPage() {
  void dynamic;
  await requireActiveSubscription();

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_servicios")) {
    return <NoAcceso />;
  }

  const servicios = await getServicios();

  return (
    <div className="container mx-auto py-4">
      <HeaderComponent
        Icon={ListCheck}
        screenName="Servicios"
        description="Listado de todos los servicios disponibles"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={servicios} />
      </div>
      <div className="block md:hidden">
        <ServicioListMobile servicios={servicios} />
      </div>
    </div>
  );
}
