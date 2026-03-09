"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type Historial = {
  productoId: string;
  productoNombre: string;
  totalUsado: number;
  servicios: Record<string, number>;
};

const config = {
  totalUsado: { label: "Cantidad usada", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export default function InventarioHistorial({ data }: { data: Historial[] }) {
  const [selected, setSelected] = useState<string | null>(data[0]?.productoId ?? null);

  const selectedItem = useMemo(
    () => data.find((item) => item.productoId === selected) ?? null,
    [data, selected]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de uso de inventario</CardTitle>
        <CardDescription>
          Toque una barra para ver en qué servicios se consumió cada producto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={data} onClick={(state) => {
            const active = state?.activePayload?.[0]?.payload as Historial | undefined;
            if (active?.productoId) setSelected(active.productoId);
          }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="productoNombre" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="totalUsado" fill="var(--color-totalUsado)" radius={4} />
          </BarChart>
        </ChartContainer>

        <div className="rounded-md border p-3">
          <p className="font-medium mb-2">
            {selectedItem ? `Detalle de ${selectedItem.productoNombre}` : "Seleccione un producto"}
          </p>
          <div className="space-y-1 text-sm">
            {selectedItem
              ? Object.entries(selectedItem.servicios).map(([servicio, cantidad]) => (
                  <div key={servicio} className="flex justify-between">
                    <span>{servicio}</span>
                    <span>{cantidad}</span>
                  </div>
                ))
              : <p className="text-muted-foreground">Sin datos para mostrar.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
