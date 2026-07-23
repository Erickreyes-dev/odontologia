"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { format, startOfDay, endOfDay, startOfMonth, subDays, subMonths, subYears } from "date-fns";
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
import { formatMoneyAmount } from "@/lib/currency-format";
import { useTenantCurrency } from "@/hooks/use-tenant-currency";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Cell, Legend, Pie, PieChart } from "recharts";
import { PagosUltimos12MesesChart } from "./pagos-ultimos-12-meses-chart";
import { ProyeccionVentasRadialChart } from "./proyeccion-ventas-radial-chart";
import { PacientesPorConsultaUltimos12MesesChart } from "./pacientes-por-consulta-ultimos-12-meses-chart";

type AgeRange = "0-17" | "18-30" | "31-45" | "46-60" | "61+";

type DashboardData = {
  pacientes: {
    nombre: string;
    apellido: string;
    genero: string | null;
    direccion: string | null;
    fechaNacimiento: string | null;
    conocioClinica: string | null;
  }[];
  consultas: {
    fecha: string;
    pacienteId: string;
    pacienteFechaNacimiento: string | null;
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
  inventarioBajo: { id: string; nombre: string; stock: number; stockMinimo: number; unidad: string | null }[];
  cuotasPendientes: {
    cliente: string;
    cuotasFaltantes: number;
    montoDebe: number;
  }[];
};

const pieChartConfig = {
  cantidad: {
    label: "Cantidad",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DashboardClient({ data }: { data: DashboardData }) {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: startOfDay(startOfMonth(new Date())),
    to: endOfDay(new Date()),
  }));
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRange | null>(null);
  const currency = useTenantCurrency();
  const isMobile = useIsMobile();

  const applyQuickRange = (type: "7d" | "1m" | "1y") => {
    const today = new Date();
    const from =
      type === "7d"
        ? subDays(today, 6)
        : type === "1m"
          ? subMonths(today, 1)
          : subYears(today, 1);

    setRange({
      from: startOfDay(from),
      to: endOfDay(today),
    });
  };

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
  const ticketPromedio = serviciosHechos > 0 ? totalPagos / serviciosHechos : 0;

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

  const consultasPorEdadSeleccionada = useMemo(() => {
    if (!selectedAgeRange) return consultasFiltradas;

    return consultasFiltradas.filter((consulta) => {
      if (!consulta.pacienteFechaNacimiento) return false;
      const birth = new Date(consulta.pacienteFechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;

      return (
        (selectedAgeRange === "0-17" && age >= 0 && age <= 17) ||
        (selectedAgeRange === "18-30" && age >= 18 && age <= 30) ||
        (selectedAgeRange === "31-45" && age >= 31 && age <= 45) ||
        (selectedAgeRange === "46-60" && age >= 46 && age <= 60) ||
        (selectedAgeRange === "61+" && age >= 61)
      );
    });
  }, [consultasFiltradas, selectedAgeRange]);

  const serviciosPieData = useMemo(() => {
    const map = consultasPorEdadSeleccionada.reduce<Record<string, number>>((acc, consulta) => {
      consulta.detalleServicios.forEach((detalle) => {
        acc[detalle.nombre] = (acc[detalle.nombre] ?? 0) + detalle.cantidad;
      });
      return acc;
    }, {});

    return Object.entries(map)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [consultasPorEdadSeleccionada]);

  const direcciones = data.pacientes.filter((p) => Boolean(p.direccion?.trim())).length;

  const conocioClinicaPieData = useMemo(() => {
    const map = data.pacientes.reduce<Record<string, number>>((acc, paciente) => {
      const key = paciente.conocioClinica?.trim() || "Sin especificar";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(map)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [data.pacientes]);

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
    <div className="container mx-auto space-y-6 py-2 overflow-x-hidden">
      <HeaderComponent
        Icon={UsersRound}
        description="Indicadores clínicos y financieros por rango de fecha."
        screenName="Dashboard"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => applyQuickRange("7d")}>
            Últimos 7 días
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => applyQuickRange("1m")}>
            1 mes
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => applyQuickRange("1y")}>
            1 año
          </Button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal sm:w-[300px]",
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
              numberOfMonths={isMobile ? 1 : 2}
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
            <CardTitle className="text-sm">Ticket promedio</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoneyAmount(ticketPromedio, currency)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ventas del rango</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoneyAmount(totalPagos, currency)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de edades</CardTitle>
            <p className="text-sm text-muted-foreground">Selecciona un rango para filtrar los servicios realizados.</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieChartConfig} className="h-[260px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={edadesPieData} dataKey="cantidad" nameKey="name" outerRadius={90} label>
                  {edadesPieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                      className="cursor-pointer"
                      opacity={!selectedAgeRange || selectedAgeRange === entry.name ? 1 : 0.35}
                      onClick={() => setSelectedAgeRange((current) => current === entry.name ? null : entry.name as AgeRange)}
                    />
                  ))}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios más realizados{selectedAgeRange ? ` (${selectedAgeRange} años)` : ""}</CardTitle>
            {selectedAgeRange && (
              <Button type="button" variant="ghost" size="sm" className="w-fit px-0" onClick={() => setSelectedAgeRange(null)}>
                Quitar filtro de edad
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieChartConfig} className="h-[260px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={serviciosPieData}
                  dataKey="cantidad"
                  nameKey="name"
                  outerRadius={80}
                  cx="40%"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {serviciosPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>¿Cómo conocieron la clínica?</CardTitle>
            <p className="text-sm text-muted-foreground">Distribución basada en el catálogo seleccionado en pacientes.</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieChartConfig} className="h-[260px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={conocioClinicaPieData}
                  dataKey="cantidad"
                  nameKey="name"
                  outerRadius={80}
                  cx="40%"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {conocioClinicaPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <PagosUltimos12MesesChart data={data.pagos} />
        <PacientesPorConsultaUltimos12MesesChart data={data.consultas} />
        <ProyeccionVentasRadialChart data={data.pagos} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario con stock bajo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.inventarioBajo.length ? data.inventarioBajo.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{item.nombre}</span>
              <Badge variant="destructive">{item.stock} / min. {item.stockMinimo} {item.unidad ?? ""}</Badge>
            </div>
          )) : <p className="text-sm text-muted-foreground">No hay materiales con stock bajo.</p>}
        </CardContent>
      </Card>

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
              <div key={item.cliente} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="break-words">
                  {item.cliente} - {item.cuotasFaltantes} cuotas faltantes
                </span>
                <Badge variant="outline">{formatMoneyAmount(item.montoDebe, currency)}</Badge>
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
