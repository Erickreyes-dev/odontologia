import HeaderComponent from "@/components/HeaderComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/auth";
import NoAccess from "@/components/noAccess";
import { getReservacionesCitas } from "./actions";
import { CalendarCheck } from "lucide-react";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ReservacionesCitasPage() {
  const session = await getSession();
  if (!session?.Permiso?.includes("ver_citas")) {
    return <NoAccess />;
  }

  const reservaciones = await getReservacionesCitas();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <HeaderComponent
        screenName="Reservaciones de cita"
        description="Solicitudes registradas desde el enlace público personalizado de la clínica."
        Icon={CalendarCheck}
      />

      <div className="grid gap-4">
        {reservaciones.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay reservaciones públicas registradas.
            </CardContent>
          </Card>
        ) : (
          reservaciones.map((reservacion) => (
            <Card key={reservacion.id}>
              <CardHeader>
                <CardTitle className="text-lg">{reservacion.nombrePaciente}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fecha solicitada: {formatDate(reservacion.fechaSolicitada)} · Recibida: {formatDate(reservacion.createAt)}
                </p>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <p><span className="font-medium">Correo:</span> {reservacion.correoPaciente}</p>
                <p><span className="font-medium">Teléfono:</span> {reservacion.telefonoPaciente}</p>
                <p className="md:col-span-2"><span className="font-medium">Motivo:</span> {reservacion.motivo}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
