"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, Filter } from "lucide-react";

interface CitasFiltersProps {
  defaultFrom: string;
  defaultTo: string;
}

export function CitasFilters({ defaultFrom, defaultTo }: CitasFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRange = useMemo<DateRange>(
    () => ({
      from: defaultFrom ? parseISO(defaultFrom) : undefined,
      to: defaultTo ? parseISO(defaultTo) : undefined,
    }),
    [defaultFrom, defaultTo]
  );
  const [range, setRange] = useState<DateRange | undefined>(defaultRange);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams?.toString());
    console.log("🚀 ~ handleSubmit ~ params:", params)
    if (range?.from) {
      params.set("from", format(range.from, "yyyy-MM-dd"));
    } else {
      params.delete("from");
    }
    if (range?.to) {
      params.set("to", format(range.to, "yyyy-MM-dd"));
    } else if (range?.from) {
      params.set("to", format(range.from, "yyyy-MM-dd"));
    } else {
      params.delete("to");
    }
    router.push(`/citas?${params.toString()}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start gap-2">
              <CalendarDays className="h-4 w-4" />
              {range?.from
                ? range.to
                  ? `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`
                  : format(range.from, "dd/MM/yyyy")
                : "Seleccionar rango"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              showOutsideDays
            />
          </PopoverContent>
        </Popover>

        <Button type="submit" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>
      </div>

      <Link href="/citas/calendario" className="w-full md:w-auto">
        <Button variant="outline" className="w-full md:w-auto gap-2">
          <CalendarDays className="h-4 w-4" />
          Ver calendario
        </Button>
      </Link>
    </form>
  );
}
