"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HistorialDateRangeFilterProps {
  defaultDesde?: string;
  defaultHasta?: string;
}

export function HistorialDateRangeFilter({ defaultDesde, defaultHasta }: HistorialDateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultRange = useMemo<DateRange>(
    () => ({
      from: defaultDesde ? parseISO(defaultDesde) : undefined,
      to: defaultHasta ? parseISO(defaultHasta) : undefined,
    }),
    [defaultDesde, defaultHasta]
  );

  const [range, setRange] = useState<DateRange | undefined>(defaultRange);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams(searchParams?.toString());

    if (range?.from) {
      params.set("desde", format(range.from, "yyyy-MM-dd"));
    } else {
      params.delete("desde");
    }

    if (range?.to) {
      params.set("hasta", format(range.to, "yyyy-MM-dd"));
    } else if (range?.from) {
      params.set("hasta", format(range.from, "yyyy-MM-dd"));
    } else {
      params.delete("hasta");
    }

    router.push(`/inventario?${params.toString()}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-center mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full md:w-[320px] justify-start text-left font-normal",
              !range && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, "dd MMM yyyy", { locale: es })} - {" "}
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

      <Button type="submit" variant="outline" className="w-full md:w-auto gap-2">
        <Filter className="h-4 w-4" />
        Filtrar historial
      </Button>
    </form>
  );
}
