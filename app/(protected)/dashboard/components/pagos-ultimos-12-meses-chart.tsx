"use client";

import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
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

type PagosChartData = {
  fechaPago: string;
  monto: number;
};

type PagosUltimos12MesesChartProps = {
  data: PagosChartData[];
};

const chartConfig = {
  total: {
    label: "Ventas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function PagosUltimos12MesesChart({ data }: PagosUltimos12MesesChartProps) {
  const lineData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = subMonths(now, 11 - index);
      const key = format(date, "yyyy-MM");
      return {
        key,
        month: format(date, "MMM", { locale: es }),
        total: 0,
      };
    });

    const monthMap = new Map(months.map((item) => [item.key, item]));

    data.forEach((item) => {
      const key = format(new Date(item.fechaPago), "yyyy-MM");
      const month = monthMap.get(key);
      if (month) month.total += item.monto;
    });

    return months;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas de los últimos 12 meses</CardTitle>
        <CardDescription>Tendencia mensual lineal</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <LineChart data={lineData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
