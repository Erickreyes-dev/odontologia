"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { PlanTratamiento, ESTADOS_PLAN } from "../schema";
import { Progress } from "@/components/ui/progress";

const getEstadoBadge = (estado: string) => {
  const estadoInfo = ESTADOS_PLAN.find((e) => e.value === estado);
  const label = estadoInfo?.label || estado;

  switch (estado) {
    case "ACTIVO":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          {label}
        </Badge>
      );
    case "PAUSADO":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          {label}
        </Badge>
      );
    case "COMPLETADO":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
          {label}
        </Badge>
      );
    case "CANCELADO":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
          {label}
        </Badge>
      );
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

export const columns: ColumnDef<PlanTratamiento>[] = [
  {
    accessorKey: "pacienteNombre",
    header: "Paciente",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("pacienteNombre")}</div>
    ),
  },
  {
    accessorKey: "nombre",
    header: "Plan de Tratamiento",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("nombre")}</div>
        {row.original.descripcion && (
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {row.original.descripcion}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => getEstadoBadge(row.getValue("estado")),
  },
  {
    accessorKey: "fechaInicio",
    header: "Fecha Inicio",
    cell: ({ row }) => {
      const fecha = row.getValue("fechaInicio") as Date;
      return fecha
        ? format(new Date(fecha), "PPP", { locale: es })
        : "-";
    },
  },
  {
    accessorKey: "totalEtapas",
    header: "Etapas",
    cell: ({ row }) => (
      <div className="text-center">{row.original.totalEtapas || 0}</div>
    ),
  },
  {
    id: "progreso",
    header: "Progreso",
    cell: ({ row }) => {
      const total = row.original.totalSeguimientos || 0;
      const completados = row.original.seguimientosCompletados || 0;
      const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={porcentaje} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground w-12">
            {completados}/{total}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const plan = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href={`/planes-tratamiento/${plan.id}`}>
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalle
              </DropdownMenuItem>
            </Link>
            {plan.estado === "ACTIVO" && (
              <Link href={`/planes-tratamiento/${plan.id}/edit`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              </Link>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
