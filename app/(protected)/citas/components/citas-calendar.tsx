"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cita } from "../schema";

interface CitasCalendarProps {
  citas: Cita[];
  initialDate: string;
}

export function CitasCalendar({ citas, initialDate }: CitasCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(parseISO(initialDate));

  const citasPorDia = useMemo(() => {
    return citas.filter((cita) => isSameDay(new Date(cita.fechaHora), selectedDate));
  }, [citas, selectedDate]);

  const fechasConCitas = useMemo(() => {
    return citas.map((cita) => new Date(cita.fechaHora));
  }, [citas]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Calendario de citas</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            showOutsideDays
            className="w-full"
            modifiers={{ conCitas: fechasConCitas }}
            modifiersClassNames={{ conCitas: "bg-primary/10" }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Citas para {format(selectedDate, "PPP", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {citasPorDia.length > 0 ? (
            citasPorDia.map((cita) => (
              <div key={cita.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {cita.paciente
                      ? `${cita.paciente.nombre} ${cita.paciente.apellido}`
                      : "Paciente no asignado"}
                  </div>
                  <Badge variant="outline">{cita.estado}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(cita.fechaHora), "p", { locale: es })}
                  {cita.consultorio?.nombre ? ` · ${cita.consultorio.nombre}` : ""}
                </div>
                <div className="text-sm">
                  {cita.medico?.empleado
                    ? `Dr. ${cita.medico.empleado.nombre} ${cita.medico.empleado.apellido}`
                    : "Medico no asignado"}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay citas programadas para este dia.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
