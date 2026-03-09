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

const genderChartConfig = {
  cantidad: {
    label: "Pacientes",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DashboardClient({ data }: { data: DashboardData }) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfDay(subMonths(new Date(), 1)),
    to: endOfDay(new Date()),
  });

  const consultasFiltradas = useMemo(() => {
    if (!range?.from || !range?.to) return data.consultas;

    return data.consultas.filter((item) => {
      const date = new Date(item.fecha);
      return date >= startOfDay(range.from) && date <= endOfDay(range.to);
    });
  }, [data.consultas, range]);

  const pagosFiltrados = useMemo(() => {
    if (!range?.from || !range?.to) return data.pagos;

    return data.pagos.filter((item) => {
      const date = new Date(item.fechaPago);
      return date >= startOfDay(range.from) && date <= endOfDay(range.to);
    });
  }, [data.pagos, range]);

  const pagosPieData = useMemo(() => {
    const grouped = pagosFiltrados.reduce<Record<string, number>>((acc, pago) => {
      const month = format(new Date(pago.fechaPago), "MMM", { locale: es });
      acc[month] = (acc[month] ?? 0) + pago.monto;
      return acc;
    }, {});

    return Object.entries(grouped).map(([month, total]) => ({ month, total }));
  }, [pagosFiltrados]);

  const serviciosHechos = consultasFiltradas.reduce((acc, item) => acc + item.servicios, 0);
  const consultasHechas = consultasFiltradas.length;
  const totalPagos = pagosFiltrados.reduce((acc, item) => acc + item.monto, 0);

  const edadPromedio = useMemo(() => {
    const edades = data.pacientes
      .map((p) => {
        if (!p.fechaNacimiento) return null;
        const birth = new Date(p.fechaNacimiento);
        const age = new Date().getFullYear() - birth.getFullYear();
        return age >= 0 ? age : null;
      })
      .filter((age): age is number => age !== null);

    if (!edades.length) return 0;
    return Math.round(edades.reduce((acc, age) => acc + age, 0) / edades.length);
  }, [data.pacientes]);

  const direcciones = data.pacientes.filter((p) => Boolean(p.direccion?.trim())).length;

  const generoData = useMemo(() => {
    const map = data.pacientes.reduce<Record<string, number>>((acc, p) => {
      const key = p.genero?.trim() || "No especificado";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(map).map(([name, cantidad]) => ({ name, cantidad }));
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
            <CardTitle className="text-sm">Edad promedio</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{edadPromedio} años</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Direcciones registradas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{direcciones}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ingresos del rango</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(totalPagos)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Género de pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={genderChartConfig} className="h-[260px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={generoData} dataKey="cantidad" nameKey="name" outerRadius={90} label>
                  {generoData.map((entry, index) => (
                    <Cell key={entry.name} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <PagosUltimos12MesesChart data={pagosPieData} />
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
