import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ListCheck } from "lucide-react";
import { getRolesPermisos } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import RoleListMobile from "./components/roles-list-mobile";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function EstadoServicio() {
  void dynamic;
  await requireActiveSubscription();




  const permisos = await getSessionPermisos();
  if (!permisos?.includes("ver_roles")) {
    return <NoAcceso />;
  }

  const data = await getRolesPermisos();
  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ListCheck}
        description="En este apartado podrá ver todos los roles"
        screenName="Roles"
      />
      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <RoleListMobile roles={data} />
      </div>
    </div>
  );
}
