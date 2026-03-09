"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cita, ESTADOS_CITA } from "../schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CitasCalendarProps {
  citas: Cita[];
  initialDate: string;
}

export function CitasCalendar({ citas, initialDate }: CitasCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(parseISO(initialDate));
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");

  const citasFiltradas = useMemo(() => {
    if (estadoFiltro === "todos") return citas;
    return citas.filter((cita) => cita.estado === estadoFiltro);
  }, [citas, estadoFiltro]);

  const citasPorDia = useMemo(() => {
    return citasFiltradas.filter((cita) => isSameDay(new Date(cita.fechaHora), selectedDate));
  }, [citasFiltradas, selectedDate]);

  const fechasProgramadas = useMemo(() => citas.filter((cita) => cita.estado === "programada").map((cita) => new Date(cita.fechaHora)), [citas]);
  const fechasAtendidas = useMemo(() => citas.filter((cita) => cita.estado === "atendida").map((cita) => new Date(cita.fechaHora)), [citas]);
  const fechasCanceladas = useMemo(() => citas.filter((cita) => cita.estado === "cancelada").map((cita) => new Date(cita.fechaHora)), [citas]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Calendario de citas</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_CITA.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            showOutsideDays
            className="w-full"
            modifiers={{
              programadas: fechasProgramadas,
              atendidas: fechasAtendidas,
              canceladas: fechasCanceladas,
            }}
            modifiersClassNames={{
              programadas: "relative after:absolute after:bottom-1 after:left-[35%] after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              atendidas: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500",
              canceladas: "relative after:absolute after:bottom-1 after:left-[65%] after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-destructive",
            }}
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
              <div key={cita.id} className="rounded-md border p-3 space-y-3">
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
                <div className="flex flex-wrap gap-2">
                  <Link href={`/citas/${cita.id}/consulta`}>
                    <Button size="sm" className="w-full sm:w-auto">
                      Ver consulta
                    </Button>
                  </Link>
                  <Link href={`/citas/${cita.id}/edit`}>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      Editar cita
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay citas para este día con el estado seleccionado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
