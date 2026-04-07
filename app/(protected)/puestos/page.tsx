import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Users } from "lucide-react";
import { getPuestos } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import PuestoListMobile from "./components/puesto-list-mobile";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function Puestos() {
  void dynamic;
  await requireActiveSubscription();


  const permisos = await getSessionPermisos();


  const data = await getPuestos();
  if (!permisos?.includes("ver_puestos")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Users}
        description="En este apartado podrá ver todos los puestos."
        screenName="Puestos"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <PuestoListMobile puesto={data} />
      </div>
    </div>
  );
}
