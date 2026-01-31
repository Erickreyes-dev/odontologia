"use client";

import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Cita } from "../schema";
import { deleteCita, cambiarEstadoCita } from "../actions";

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "programada":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Programada</Badge>;
    case "atendida":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Atendida</Badge>;
    case "cancelada":
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelada</Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

export const columns: ColumnDef<Cita>[] = [
  {
    accessorKey: "fechaHora",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Fecha y Hora
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fechaHora = row.original.fechaHora;
      if (!fechaHora) return <div>-</div>;
      return (
        <div>
          {format(new Date(fechaHora), "PPP p", { locale: es })}
        </div>
      );
    },
  },
  {
    accessorKey: "paciente",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Paciente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const paciente = row.original.paciente;
      if (!paciente) return <div>-</div>;
      return <div>{`${paciente.nombre} ${paciente.apellido}`}</div>;
    },
  },
  {
    accessorKey: "medico",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Medico
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const medico = row.original.medico;
      if (!medico?.empleado) return <div>-</div>;
      return <div>{`${medico.empleado.nombre} ${medico.empleado.apellido}`}</div>;
    },
  },
  {
    accessorKey: "consultorio",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Consultorio
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const consultorio = row.original.consultorio;
      if (!consultorio) return <div>-</div>;
      return <div>{consultorio.nombre}</div>;
    },
  },
  {
    accessorKey: "motivo",
    header: "Motivo",
    cell: ({ row }) => {
      const motivo = row.original.motivo;
      return <div className="max-w-[200px] truncate">{motivo || "-"}</div>;
    },
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
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string;
      return getEstadoBadge(estado);
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const cita = row.original;
      return <ActionsCell cita={cita} />;
    },
  },
];

function ActionsCell({ cita }: { cita: Cita }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!cita.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteCita(cita.id);
      if (result.success) {
        toast.success("Cita eliminada", {
          description: "La cita ha sido eliminada correctamente.",
        });
        router.refresh();
      } else {
        toast.error("Error al eliminar", {
          description: result.error || "No se pudo eliminar la cita.",
        });
      }
    } catch (error) {
      toast.error("Error al eliminar", {
        description: "Ocurrio un error inesperado.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!cita.id) return;

    try {
      const result = await cambiarEstadoCita(cita.id, nuevoEstado);
      if (result.success) {
        toast.success("Estado actualizado", {
          description: `La cita ha sido marcada como ${nuevoEstado}.`,
        });
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error || "No se pudo cambiar el estado.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Ocurrio un error inesperado.",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir Menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <Link href={`/citas/${cita.id}/edit`}>
            <DropdownMenuItem>Editar</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar estado</DropdownMenuLabel>
          {cita.estado !== "programada" && (
            <DropdownMenuItem onClick={() => handleCambiarEstado("programada")}>
              Marcar como Programada
            </DropdownMenuItem>
          )}
          {cita.estado !== "atendida" && (
            <DropdownMenuItem onClick={() => handleCambiarEstado("atendida")}>
              Marcar como Atendida
            </DropdownMenuItem>
          )}
          {cita.estado !== "cancelada" && (
            <DropdownMenuItem onClick={() => handleCambiarEstado("cancelada")}>
              Marcar como Cancelada
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estas seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Esto eliminara permanentemente
              la cita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
