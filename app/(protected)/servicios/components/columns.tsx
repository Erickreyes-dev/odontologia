"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Servicio } from "../schema";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircleIcon, XCircleIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export const columns: ColumnDef<Servicio>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
  },
  {
    accessorKey: "precioBase",
    header: "Precio Base",
  },
  {
    accessorKey: "duracionMin",
    header: "Duración (min)",
  },
  {
    accessorKey: "activo",
    header: "Estado",
    cell: ({ row }) => {
      const activo = row.getValue("activo");
      return activo ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircleIcon className="w-4 h-4" /> Activo
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <XCircleIcon className="w-4 h-4" /> Inactivo
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const servicio = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <Link href={`/servicios/${servicio.id}/edit`}>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
