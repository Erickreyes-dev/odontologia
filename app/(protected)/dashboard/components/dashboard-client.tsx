"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { format, startOfDay, endOfDay, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { CalendarIcon, Download, UsersRound } from "lucide-react";
import HeaderComponent from "@/components/HeaderComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart } from "recharts";
import { PagosUltimos12MesesChart } from "./pagos-ultimos-12-meses-chart";
import { ProyeccionVentasRadialChart } from "./proyeccion-ventas-radial-chart";

type DashboardData = {
  pacientes: {
    nombre: string;
    apellido: string;
    genero: string | null;
    direccion: string | null;
    fechaNacimiento: string | null;
  }[];
  consultas: {
    fecha: string;
    servicios: number;
    detalleServicios: {
      nombre: string;
      cantidad: number;
    }[];
  }[];
  pagos: {
    fechaPago: string;
    monto: number;
  }[];
  cuotasPendientes: {
    cliente: string;
    cuotasFaltantes: number;
    montoDebe: number;
  }[];
};

const formatMoney = (value: number) => `L ${value.toLocaleString("es-HN")}`;

const pieChartConfig = {
  cantidad: {
    label: "Cantidad",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DashboardClient({ data }: { data: DashboardData }) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfDay(subMonths(new Date(), 1)),
    to: endOfDay(new Date()),
  });

  const consultasFiltradas = useMemo(() => {
    if (!range?.from) return data.consultas;

    const from = startOfDay(range.from);
    const to = endOfDay(range.to ?? range.from);

    return data.consultas.filter((item) => {
      const date = new Date(item.fecha);
      return date >= from && date <= to;
    });
  }, [data.consultas, range]);

  const pagosFiltrados = useMemo(() => {
    if (!range?.from) return data.pagos;

    const from = startOfDay(range.from);
    const to = endOfDay(range.to ?? range.from);

    return data.pagos.filter((item) => {
      const date = new Date(item.fechaPago);
      return date >= from && date <= to;
    });
  }, [data.pagos, range]);

  const serviciosHechos = consultasFiltradas.reduce((acc, item) => acc + item.servicios, 0);
  const consultasHechas = consultasFiltradas.length;
  const totalPagos = pagosFiltrados.reduce((acc, item) => acc + item.monto, 0);

  const edadesPieData = useMemo(() => {
    const rangos = {
      "0-17": 0,
      "18-30": 0,
      "31-45": 0,
      "46-60": 0,
      "61+": 0,
    };

    data.pacientes.forEach((paciente) => {
      if (!paciente.fechaNacimiento) return;
      const birth = new Date(paciente.fechaNacimiento);
      const today = new Date();
      let edad = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        edad -= 1;
      }

      if (edad < 0) return;
      if (edad <= 17) rangos["0-17"] += 1;
      else if (edad <= 30) rangos["18-30"] += 1;
      else if (edad <= 45) rangos["31-45"] += 1;
      else if (edad <= 60) rangos["46-60"] += 1;
      else rangos["61+"] += 1;
    });

    return Object.entries(rangos).map(([name, cantidad]) => ({ name, cantidad }));
  }, [data.pacientes]);

  const serviciosPieData = useMemo(() => {
    const map = consultasFiltradas.reduce<Record<string, number>>((acc, consulta) => {
      consulta.detalleServicios.forEach((detalle) => {
        acc[detalle.nombre] = (acc[detalle.nombre] ?? 0) + detalle.cantidad;
      });
      return acc;
    }, {});

    return Object.entries(map)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [consultasFiltradas]);

  const direcciones = data.pacientes.filter((p) => Boolean(p.direccion?.trim())).length;

  const descargarExcelCuotas = () => {
    const rows = data.cuotasPendientes.map((item) => ({
      Cliente: item.cliente,
      "Cuotas faltantes": item.cuotasFaltantes,
      "Monto pendiente": item.montoDebe,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cuotas pendientes");
    XLSX.writeFile(wb, "cuotas-pendientes.xlsx");
  };

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent
        Icon={UsersRound}
        description="Indicadores clínicos y financieros por rango de fecha."
        screenName="Dashboard"
      />

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !range && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {range?.from ? (
                range.to ? (
                  <>
                    {format(range.from, "dd MMM yyyy", { locale: es })} -{" "}
                    {format(range.to, "dd MMM yyyy", { locale: es })}
                  </>
                ) : (
                  format(range.from, "dd MMM yyyy", { locale: es })
                )
              ) : (
                <span>Selecciona un rango</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={range?.from}
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Servicios hechos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{serviciosHechos}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Consultas hechas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{consultasHechas}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pacientes activos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.pacientes.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Direcciones registradas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{direcciones}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ventas del rango</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(totalPagos)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de edades</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieChartConfig} className="h-[260px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={edadesPieData} dataKey="cantidad" nameKey="name" outerRadius={90} label>
                  {edadesPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios más realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieChartConfig} className="h-[260px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={serviciosPieData}
                  dataKey="cantidad"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {serviciosPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <PagosUltimos12MesesChart data={data.pagos} />
        <ProyeccionVentasRadialChart data={data.pagos} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cuotas pendientes</CardTitle>
          <Button onClick={descargarExcelCuotas} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Descargar Excel
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.cuotasPendientes.length ? (
            data.cuotasPendientes.map((item) => (
              <div key={item.cliente} className="flex justify-between items-center border rounded-md p-3">
                <span>
                  {item.cliente} - {item.cuotasFaltantes} cuotas faltantes
                </span>
                <Badge variant="outline">{formatMoney(item.montoDebe)}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No hay cuotas pendientes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
