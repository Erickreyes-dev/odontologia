import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { CalendarDays } from "lucide-react";
import { getCitasPorRango } from "../actions";
import { CitasCalendar } from "../components/citas-calendar";
import { endOfMonth, format, startOfMonth } from "date-fns";

export default async function CitasCalendarioPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_citas")) {
    return <NoAcceso />;
  }

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const citas = await getCitasPorRango({ from: monthStart, to: monthEnd });

  return (
    <div className="container mx-auto py-4 space-y-4">
      <HeaderComponent
        Icon={CalendarDays}
        description="Vista de calendario con las citas programadas"
        screenName="Calendario de citas"
      />

      <CitasCalendar citas={citas} initialDate={format(today, "yyyy-MM-dd")} />
    </div>
  );
}
