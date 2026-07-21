"use client";

import { useMemo, useState } from "react";
import { format, startOfDay, endOfDay, startOfMonth, subDays, subMonths, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { HonorariosTable, type HonorarioRow } from "./honorarios-table";

type DateField = "fecha" | "fechaLiquidado" | "fechaPago";

const f = (v: number) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

const dateFieldLabels: Record<DateField, string> = {
  fecha: "Fecha generado",
  fechaLiquidado: "Fecha liquidación",
  fechaPago: "Fecha pago",
};

function parseDate(value: string) {
  if (!value || value === "-") return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function HonorariosClient({ data }: { data: HonorarioRow[] }) {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: startOfDay(startOfMonth(new Date())),
    to: endOfDay(new Date()),
  }));
  const [dateField, setDateField] = useState<DateField>("fechaLiquidado");
  const isMobile = useIsMobile();

  const applyQuickRange = (type: "7d" | "1m" | "1y") => {
    const today = new Date();
    const from = type === "7d" ? subDays(today, 6) : type === "1m" ? subMonths(today, 1) : subYears(today, 1);
    setRange({ from: startOfDay(from), to: endOfDay(today) });
  };

  const filteredData = useMemo(() => {
    if (!range?.from) return data;
    const from = startOfDay(range.from);
    const to = endOfDay(range.to ?? range.from);

    return data.filter((item) => {
      const date = parseDate(item[dateField]);
      return date ? date >= from && date <= to : false;
    });
  }, [data, dateField, range]);

  const totalIngresos = filteredData.reduce((acc, h) => acc + h.total, 0);
  const totalLiquidado = filteredData.filter((h) => h.estado === "LIQUIDADO").reduce((acc, h) => acc + h.comision, 0);
  const totalPendiente = filteredData.filter((h) => h.estado !== "LIQUIDADO").reduce((acc, h) => acc + h.comision, 0);
  const cards = [
    { label: "Ingresos", value: f(totalIngresos) },
    { label: "Liquidados", value: f(totalLiquidado) },
    { label: "Pendientes", value: f(totalPendiente) },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={dateField}
          onChange={(event) => setDateField(event.target.value as DateField)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
          aria-label="Fecha para filtrar honorarios"
        >
          {Object.entries(dateFieldLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => applyQuickRange("7d")}>Últimos 7 días</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => applyQuickRange("1m")}>1 mes</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => applyQuickRange("1y")}>1 año</Button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal sm:w-[300px]", !range && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {range?.from ? range.to ? <>{format(range.from, "dd MMM yyyy", { locale: es })} - {format(range.to, "dd MMM yyyy", { locale: es })}</> : format(range.from, "dd MMM yyyy", { locale: es }) : <span>Personalizado</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar initialFocus mode="range" defaultMonth={range?.from} selected={range} onSelect={setRange} numberOfMonths={isMobile ? 1 : 2} />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => <div key={card.label} className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{card.label}</p><p className="text-2xl font-semibold">{card.value}</p></div>)}
      </div>
      <HonorariosTable data={filteredData} />
    </>
  );
}
