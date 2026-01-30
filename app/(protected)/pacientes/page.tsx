import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import {  Users } from "lucide-react";
import { getPacientes } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import SeguroListMobile from "./components/seguro-list-mobile";
import PacienteListMobile from "./components/seguro-list-mobile";

export default async function Seguros() {

  const permisos = await getSessionPermisos();


  const data = await getPacientes();
  if (!permisos?.includes("ver_pacientes")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={Users}
        description="En este apartado podrá ver todos los seguros."
        screenName="Pacientes"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <PacienteListMobile pacientes={data}/>
      </div>
    </div>
  );
}
