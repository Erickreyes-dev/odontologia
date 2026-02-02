import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { FileText } from "lucide-react";
import { getCotizaciones } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import CotizacionListMobile from "./components/cotizacion-list-mobile";

export default async function Cotizaciones() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_cotizaciones")) {
    return <NoAcceso />;
  }

  const data = await getCotizaciones();

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={FileText}
        description="En este apartado podrá ver todas las cotizaciones."
        screenName="Cotizaciones"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <CotizacionListMobile cotizaciones={data} />
      </div>
    </div>
  );
}
