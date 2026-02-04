import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { CalendarDays } from "lucide-react";
import { getCitas } from "./actions";
import { CitaTable } from "./components/cita-table";
import CitaListMobile from "./components/cita-list-mobile";
import { CitasFilters } from "./components/citas-filters";
import { format } from "date-fns";

interface CitasPageProps {
  searchParams?: { from?: string; to?: string };
}

export default async function CitasPage({ searchParams }: CitasPageProps) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_citas")) {
    return <NoAcceso />;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const from = searchParams?.from ?? today;
  const to = searchParams?.to ?? today;

  const citasPag = await getCitas({ page: 1, pageSize: 10, from, to });

  return (
    <div className="container mx-auto py-2 space-y-4">
      <HeaderComponent
        Icon={CalendarDays}
        description="En este apartado podra ver y gestionar todas las citas."
        screenName="Citas"
      />

      <CitasFilters defaultFrom={from} defaultTo={to} />

      {/* Desktop: tabla con paginacion */}
      <div className="hidden md:block">
        <CitaTable initialData={citasPag} from={from} to={to} />
      </div>

      {/* Mobile: lista filtrable con paginacion interna */}
      <div className="block md:hidden">
        <CitaListMobile
          initialData={citasPag.data}
          initialPage={citasPag.page}
          initialPageCount={citasPag.pageCount}
          from={from}
          to={to}
        />
      </div>
    </div>
  );
}
