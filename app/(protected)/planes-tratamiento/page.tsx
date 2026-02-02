import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { ClipboardList } from "lucide-react";
import { getPlanesTratamiento } from "./actions";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { PlanListMobile } from "./components/plan-list-mobile";

export default async function PlanesTratamientoPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_planes_tratamiento")) {
    return <NoAcceso />;
  }

  const planes = await getPlanesTratamiento();

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={ClipboardList}
        description="Gestiona los planes de tratamiento de los pacientes."
        screenName="Planes de Tratamiento"
      />
      {/* Desktop */}
      <div className="hidden md:block">
        <DataTable columns={columns} data={planes} />
      </div>
      {/* Mobile */}
      <div className="md:hidden">
        <PlanListMobile planes={planes} />
      </div>
    </div>
  );
}
