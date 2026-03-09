"use client";

import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type PagoData = {
  fechaPago: string;
  monto: number;
};

type ProyeccionVentasRadialChartProps = {
  data: PagoData[];
};

const chartConfig = {
  valor: {
    label: "Ventas",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

function calcularProyeccionLineal(valores: number[]) {
  const n = valores.length;
  if (!n) return 0;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = valores.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * valores[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

  const divisor = n * sumXX - sumX * sumX;
  if (divisor === 0) return valores[n - 1] ?? 0;

  const pendiente = (n * sumXY - sumX * sumY) / divisor;
  const intercepto = (sumY - pendiente * sumX) / n;
  const proyeccion = intercepto + pendiente * (n + 1);
  return Math.max(0, proyeccion);
}

export function ProyeccionVentasRadialChart({ data }: ProyeccionVentasRadialChartProps) {
  const radarData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = subMonths(now, 11 - index);
      const key = format(date, "yyyy-MM");
      return { key, total: 0 };
    });

    const monthMap = new Map(months.map((m) => [m.key, m]));
    data.forEach((pago) => {
      const key = format(new Date(pago.fechaPago), "yyyy-MM");
      const month = monthMap.get(key);
      if (month) month.total += pago.monto;
    });

    const valores = months.map((m) => m.total);
    const promedio = valores.reduce((acc, val) => acc + val, 0) / (valores.length || 1);
    const ultimoMes = valores[valores.length - 1] ?? 0;
    const proyeccion = calcularProyeccionLineal(valores);
    const meta = proyeccion * 1.12;

    return [
      { indicador: "Promedio", valor: Math.round(promedio) },
      { indicador: "Último mes", valor: Math.round(ultimoMes) },
      { indicador: "Proyección", valor: Math.round(proyeccion) },
      { indicador: "Meta", valor: Math.round(meta) },
    ];
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyección y meta de ventas</CardTitle>
        <CardDescription>Proyección con regresión lineal + meta sugerida del 12%</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <RadarChart data={radarData} outerRadius="75%">
            <PolarGrid />
            <PolarAngleAxis dataKey="indicador" />
            <PolarRadiusAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar dataKey="valor" stroke="var(--color-valor)" fill="var(--color-valor)" fillOpacity={0.35} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
