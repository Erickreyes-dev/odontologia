import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import {  Stethoscope } from "lucide-react";
import { redirect } from "next/navigation";
import { getMedicos } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import SeguroListMobile from "./components/seguro-list-mobile";

export default async function Seguros() {


  const session = await getSession();
  const permisos = await getSessionPermisos();

  if (!session?.TenantId || !session?.TenantSlug) {
    return <NoAcceso />;
  }
  if (!permisos?.includes("ver_seguros")) {
    return <NoAcceso />;
  }
  const data = await getMedicos();

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Stethoscope}
        description="En este apartado podrá ver todos los medicos."
        screenName="Medicos"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <SeguroListMobile medicos={data} />
      </div>
    </div>
  );
}
