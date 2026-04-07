import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Hospital } from "lucide-react";
import { getConsultorios } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import ConsultorioListMobile from "./components/seguro-list-mobile";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function Consultorio() {
  void dynamic;
  await requireActiveSubscription();


  const permisos = await getSessionPermisos();


  const data = await getConsultorios();
  if (!permisos?.includes("ver_consultorios")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Hospital}
        description="En este apartado podrá ver todos los consultorios."
        screenName="consultorio"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <ConsultorioListMobile consultorio={data} />
      </div>
    </div>
  );
}
