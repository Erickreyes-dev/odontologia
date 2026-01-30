
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ListCheck } from "lucide-react";
import { DataTable } from "./components/data-table"; // Tu componente DataTable
import { getSessionPermisos } from "@/auth";
import { getServicios } from "./actions";
import { columns } from "./components/columns";

export default async function VerServiciosPage() {
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

      <DataTable columns={columns} data={servicios} />
    </div>
  );
}
