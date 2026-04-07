import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ListCheck } from "lucide-react";
import { getPermisos } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import PermissionListMobile from "./components/permisos-list-mobile";

export default async function EstadoServicio() {


  const permisos = await getSessionPermisos();


  const data = await getPermisos();

  if (!permisos?.includes("ver_permisos")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ListCheck}
        description="En este apartado podrá ver todos los permisos"
        screenName="Permisos"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <PermissionListMobile permisos={data} />
      </div>
    </div>
  );
}
