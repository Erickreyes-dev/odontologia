"use client";

import { Cell, Pie, PieChart } from "recharts";
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
  month: string;
  total: number;
  fill?: string;
};

type PagosUltimos12MesesChartProps = {
  data: PagosChartData[];
};

const chartConfig = {
  total: {
    label: "Ganancias",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function PagosUltimos12MesesChart({ data }: PagosUltimos12MesesChartProps) {
  const pieData = data.filter((item) => item.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ganancias de los últimos 12 meses</CardTitle>
        <CardDescription>Distribución porcentual por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={pieData}
              dataKey="total"
              nameKey="month"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`${entry.month}-${index}`}
                  fill={entry.fill ?? `hsl(var(--chart-${(index % 5) + 1}))`}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
