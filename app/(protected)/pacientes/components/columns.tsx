/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { ArrowUpDown, CheckCircleIcon, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import Link from "next/link";
import { Paciente } from "../schema";
import { deletePaciente } from "../actions";
import { calcularEdad } from "@/lib/utils";

export const columns: ColumnDef<Paciente>[] = [
  {
    accessorKey: "identidad",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Identidad
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "nombre",
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
      const { nombre, apellido } = row.original;
      return <div>{`${nombre} ${apellido}`}</div>;
    },
  },
  {
    accessorKey: "telefono",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Telefono
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "fechaNacimiento",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Edad
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fechaNacimiento = row.original.fechaNacimiento;
      if (!fechaNacimiento) return <div>-</div>;

      const edad = calcularEdad(new Date(fechaNacimiento));

      return <div>{edad} años</div>;
    },
  },
  {
    accessorKey: "correo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Correo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "genero",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center"
      >
        Genero
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },


  {
    accessorKey: "activo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-left"
      >
        Activo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("activo");
      return (
        <div className="">
          {isActive ? (
            <div className="flex gap-2">
              <CheckCircleIcon color="green" /> Activo{" "}
            </div>
          ) : (
            <div className="flex gap-2">
              <XCircleIcon color="red" /> Inactivo{" "}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const seguro = row.original;
      return <ActionsCell paciente={seguro} />;
    },
  },
];

function ActionsCell({ paciente: paciente }: { paciente: Paciente }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!paciente.id) return;

    setIsDeleting(true);
    try {
      const result = await deletePaciente(paciente.id);
      if (result.success) {
        toast.success("Seguro eliminado", {
          description: "El seguro ha sido eliminado correctamente.",
        });
        router.refresh();
      } else {
        toast.error("Error al eliminar", {
          description: result.error || "No se pudo eliminar el seguro.",
        });
      }
    } catch (error) {
      toast.error("Error al eliminar", {
        description: "Ocurrió un error inesperado.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
          <Link href={`/pacientes/${paciente.id}/edit`}>
            <DropdownMenuItem>Editar</DropdownMenuItem>
          </Link>

        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el seguro {paciente.nombre}.
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
