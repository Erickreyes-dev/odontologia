"use client";

import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
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
  const progresoData = useMemo(() => {
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
    const baseMeta = Math.max(proyeccion, ultimoMes);
    const meta = baseMeta * 1.12;

    const metaRedondeada = Math.round(meta);
    const ventasActuales = Math.round(ultimoMes);
    const progresoPorcentaje = metaRedondeada > 0 ? (ventasActuales / metaRedondeada) * 100 : 0;
    const progresoParaArco = Math.min(Math.max(progresoPorcentaje, 0), 100);
    const restanteParaArco = 100 - progresoParaArco;

    return {
      promedio: Math.round(promedio),
      proyeccion: Math.round(proyeccion),
      meta: metaRedondeada,
      ventasActuales,
      progresoPorcentaje,
      chartData: [
        {
          indicador: "Progreso",
          restante: restanteParaArco,
          progreso: progresoParaArco,
        },
      ],
    };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyección y meta de ventas</CardTitle>
        <CardDescription>
          Avance del mes actual frente a una meta sugerida (12% sobre el mayor valor entre proyección y ventas actuales)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <RadialBarChart
            data={progresoData.chartData}
            innerRadius={90}
            outerRadius={130}
            startAngle={180}
            endAngle={0}
          >
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                    formatter={(value, name) => [
                      `${Number(value).toFixed(1)}%`,
                      name === "progreso" ? "Avance" : "Restante",
                    ]}
                />
              }
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;

                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 6} className="fill-foreground text-2xl font-bold">
                        {progresoData.progresoPorcentaje.toFixed(1)}%
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-xs">
                        {progresoData.ventasActuales.toLocaleString()} / {progresoData.meta.toLocaleString()}
                      </tspan>
                    </text>
                  );
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="restante"
              stackId="a"
              cornerRadius={8}
              fill="hsl(var(--muted))"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="progreso"
              stackId="a"
              cornerRadius={8}
              fill="var(--color-valor)"
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Promedio 12 meses: <span className="font-medium text-foreground">{progresoData.promedio.toLocaleString()}</span>
          {" · "}
          Proyección siguiente mes: <span className="font-medium text-foreground">{progresoData.proyeccion.toLocaleString()}</span>
        </p>
      </CardContent>
    </Card>
  );
}
