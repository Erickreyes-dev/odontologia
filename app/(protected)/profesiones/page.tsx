import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ShieldPlus } from "lucide-react";
import { getProfesiones } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import ProfesionListMobile from "./components/profesion-list-mobile";

export default async function Profesion() {


  const permisos = await getSessionPermisos();


  const data = await getProfesiones();
  if (!permisos?.includes("ver_profesiones")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ShieldPlus}
        description="En este apartado podrá ver todos las profesiones."
        screenName="Profesiones"
      />

      <div className="hidden md:block">
        <DataTable columns={columns} data={data} />
      </div>
      <div className="block md:hidden">
        <ProfesionListMobile profesion={data} />
      </div>
    </div>
  );
}
