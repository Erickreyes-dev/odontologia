"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = { valor: { label: "Porcentaje", color: "hsl(var(--chart-4))" } } satisfies ChartConfig;

export function FinancialGaugeCard({ title, value }: { title: string; value: number }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const progress = Math.min(Math.max(safeValue, 0), 100);
  const data = [{ name: title, progreso: progress, restante: 100 - progress }];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <RadialBarChart data={data} innerRadius={55} outerRadius={85} startAngle={180} endAngle={0}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v, name) => [`${Number(v).toFixed(1)}%`, name === "progreso" ? "Valor" : "Restante"]} />} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                return <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle"><tspan x={viewBox.cx} y={(viewBox.cy || 0) - 4} className="fill-foreground text-xl font-bold">{safeValue.toFixed(1)}%</tspan><tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-xs">Indicador</tspan></text>;
              }} />
            </PolarRadiusAxis>
            <RadialBar dataKey="restante" stackId="a" cornerRadius={8} fill="hsl(var(--muted))" className="stroke-transparent stroke-2" />
            <RadialBar dataKey="progreso" stackId="a" cornerRadius={8} fill="var(--color-valor)" className="stroke-transparent stroke-2" />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
