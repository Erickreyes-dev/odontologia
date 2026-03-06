"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Cotizacion } from "../schema";
import { sendCotizacionEmail } from "../actions";

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "borrador":
      return (
        <Badge variant="outline" className="">
          Borrador
        </Badge>
      );
    case "enviada":
      return (
        <Badge variant="outline" className="">
          Enviada
        </Badge>
      );
    case "aceptada":
      return (
        <Badge variant="outline" className="">
          Aceptada
        </Badge>
      );
    case "rechazada":
      return (
        <Badge variant="outline" className="">
          Rechazada
        </Badge>
      );
    case "parcial":
      return (
        <Badge variant="outline" className="">
          Parcial
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

export const columns: ColumnDef<Cotizacion>[] = [
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Fecha
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fecha = row.original.fecha;
      return fecha
        ? format(new Date(fecha), "dd/MM/yyyy", { locale: es })
        : "-";
    },
  },
  {
    accessorKey: "pacienteNombre",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Paciente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Estado
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => getEstadoBadge(row.original.estado),
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-right"
      >
        Total
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const total = row.original.total;
      return (
        <div className="text-right font-medium">
          L. {total.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
        </div>
      );
    },
  },
  {
    accessorKey: "detalles",
    header: "Servicios",
    cell: ({ row }) => {
      const detalles = row.original.detalles ?? [];
      return <span>{detalles.length} servicio(s)</span>;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const cotizacion = row.original;
      return <ActionsCell cotizacion={cotizacion} />;
    },
  },
];

function ActionsCell({ cotizacion }: { cotizacion: Cotizacion }) {
  const router = useRouter();

  const handleSendEmail = async () => {
    if (!cotizacion.id) return;

    const result = await sendCotizacionEmail(cotizacion.id);
    if (result.success) {
      toast.success("Cotización enviada", {
        description: "La cotización fue enviada por correo al paciente.",
      });
      router.refresh();
      return;
    }

    toast.error("No se pudo enviar el correo", {
      description: result.error,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir Menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleSendEmail}>Enviar por email</DropdownMenuItem>
        <Link href={`/cotizaciones/${cotizacion.id}/edit`}>
          <DropdownMenuItem>Editar</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <Link href={`/pacientes/${cotizacion.pacienteId}/perfil`}>
          <DropdownMenuItem>Ver Paciente</DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
