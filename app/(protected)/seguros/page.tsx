import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ShieldPlus } from "lucide-react";
import { getSeguros } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import SeguroListMobile from "./components/seguro-list-mobile";

export default async function Seguros() {

  const permisos = await getSessionPermisos();


  const data = await getSeguros();
  if (!permisos?.includes("ver_seguros")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ShieldPlus}
        description="En este apartado podrá ver todos los seguros."
        screenName="Seguros"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <SeguroListMobile seguro={data} />
      </div>
    </div>
  );
}
