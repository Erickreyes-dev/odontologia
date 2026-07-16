"use client";

import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type ConsultaData = { fecha: string; pacienteId: string };

const chartConfig = {
  pacientes: { label: "Pacientes", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export function PacientesPorConsultaUltimos12MesesChart({ data }: { data: ConsultaData[] }) {
  const lineData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = subMonths(new Date(), 11 - index);
      return { key: format(date, "yyyy-MM"), month: format(date, "MMM", { locale: es }), pacientes: new Set<string>() };
    });
    const monthMap = new Map(months.map((month) => [month.key, month]));

    data.forEach((consulta) => monthMap.get(format(new Date(consulta.fecha), "yyyy-MM"))?.pacientes.add(consulta.pacienteId));

    return months.map(({ key, month, pacientes }) => ({ key, month, pacientes: pacientes.size }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pacientes por consulta en los últimos 12 meses</CardTitle>
        <CardDescription>Pacientes únicos que recibieron al menos una consulta por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <LineChart data={lineData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="pacientes" stroke="var(--color-pacientes)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
