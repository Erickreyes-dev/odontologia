"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Filter } from "lucide-react";

interface CitasFiltersProps {
  defaultFrom: string;
  defaultTo: string;
}

export function CitasFilters({ defaultFrom, defaultTo }: CitasFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams?.toString());
    if (from) {
      params.set("from", from);
    } else {
      params.delete("from");
    }
    if (to) {
      params.set("to", to);
    } else {
      params.delete("to");
    }
    router.push(`/citas?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Desde</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Hasta</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
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
