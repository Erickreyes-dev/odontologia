"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrdenCobroWithRelations } from "../schema";

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "PENDIENTE":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
    case "PAGADA":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Pagada</Badge>;
    case "ANULADA":
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Anulada</Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

type GetColumnsOptions = { onAnular?: (id: string) => void };

export function getColumns(options?: GetColumnsOptions): ColumnDef<OrdenCobroWithRelations>[] {
  const { onAnular } = options ?? {};

  return [
    {
      accessorKey: "fechaEmision",
      header: "Emisión",
      cell: ({ row }) => {
        const fecha = row.getValue("fechaEmision") as Date;
        return format(new Date(fecha), "PPP", { locale: es });
      },
    },
    {
      accessorKey: "pacienteNombre",
      header: "Paciente",
    },
    {
      accessorKey: "concepto",
      header: "Concepto",
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => `L. ${Number(row.getValue("monto")).toFixed(2)}`,
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => getEstadoBadge(row.getValue("estado") as string),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const orden = row.original;
        return (
          <div className="flex items-center gap-2">
            {orden.estado === "PENDIENTE" && onAnular && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAnular(orden.id)}
              >
                Anular
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
