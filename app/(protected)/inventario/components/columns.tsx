"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Producto } from "../schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, CheckCircleIcon, XCircleIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export const columns: ColumnDef<Producto>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
  },
  {
    accessorKey: "unidad",
    header: "Unidad",
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "stockMinimo",
    header: "Stock mínimo",
  },
  {
    id: "alerta",
    header: "Alerta",
    cell: ({ row }) => {
      const { stock, stockMinimo } = row.original;
      if (stock <= stockMinimo) {
        return <Badge variant="destructive">Bajo</Badge>;
      }
      return <Badge variant="secondary">Ok</Badge>;
    },
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
      const producto = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <Link href={`/inventario/${producto.id}/edit`}>
              <DropdownMenuItem>Editar</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
