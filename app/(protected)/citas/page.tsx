import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { CalendarDays } from "lucide-react";
import { getCitas } from "./actions";
import { CitaTable } from "./components/cita-table";
import CitaListMobile from "./components/cita-list-mobile";

export default async function CitasPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_citas")) {
    return <NoAcceso />;
  }

  const citasPag = await getCitas({ page: 1, pageSize: 10 });

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={CalendarDays}
        description="En este apartado podra ver y gestionar todas las citas."
        screenName="Citas"
      />

      {/* Desktop: tabla con paginacion */}
      <div className="hidden md:block">
        <CitaTable initialData={citasPag} />
      </div>

      {/* Mobile: lista filtrable con paginacion interna */}
      <div className="block md:hidden">
        <CitaListMobile
          initialData={citasPag.data}
          initialPage={citasPag.page}
          initialPageCount={citasPag.pageCount}
        />
      </div>
    </div>
  );
}
