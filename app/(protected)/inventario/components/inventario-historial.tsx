"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
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

  const descargarExcel = () => {
    const rows = data.flatMap((item) => {
      const servicios = Object.entries(item.servicios);
      return servicios.length ? servicios.map(([servicio, cantidad]) => ({ Material: item.productoNombre, "Total usado": item.totalUsado, Servicio: servicio, Cantidad: cantidad })) : [{ Material: item.productoNombre, "Total usado": item.totalUsado, Servicio: "Sin servicio", Cantidad: 0 }];
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materiales utilizados");
    XLSX.writeFile(wb, "materiales-utilizados.xlsx");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Historial de uso de inventario</CardTitle>
          <CardDescription>
            La gráfica incluye todos los materiales utilizados en el rango seleccionado.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={descargarExcel}>
          <Download className="mr-2 h-4 w-4" /> Descargar
        </Button>
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
