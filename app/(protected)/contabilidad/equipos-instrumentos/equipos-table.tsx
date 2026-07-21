"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "../components/data-table";
import { EquipoInstrumentoForm } from "./equipo-form";

export type EquipoInstrumentoRow = { id:string; nombre:string; descripcion:string; cantidad:number; costoTotal:number; activo:boolean; fecha:string };
const f = (v: number) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

function Actions({ row }: { row: EquipoInstrumentoRow }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem></DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar equipo o instrumento</DialogTitle></DialogHeader>
        <EquipoInstrumentoForm initialData={row} submitLabel="Guardar" onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function EquiposInstrumentosTable({ data }: { data: EquipoInstrumentoRow[] }) {
  const columns: ColumnDef<EquipoInstrumentoRow>[] = [
    { accessorKey: "fecha", header: "Fecha" },
    { accessorKey: "nombre", header: "Nombre" },
    { accessorKey: "descripcion", header: "Descripción" },
    { accessorKey: "cantidad", header: "Cantidad" },
    { accessorKey: "costoTotal", header: "Costo total", cell: ({ row }) => f(row.original.costoTotal) },
    { accessorKey: "activo", header: "Estado", cell: ({ row }) => row.original.activo ? "Activo" : "Inactivo" },
    { id: "actions", header: "Acciones", cell: ({ row }) => <Actions row={row.original} /> },
  ];

  return <DataTable columns={columns} data={data} filterPlaceholder="Filtrar por equipo, fecha o descripción" />;
}
