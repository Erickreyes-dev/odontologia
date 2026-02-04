"use client";

import { useEffect, useState } from "react";
import { getCitas, cambiarEstadoCita, deleteCita } from "../actions";
import { Cita, ESTADOS_CITA } from "../schema";
import { Info, Pencil, Plus, Search, Trash2, Stethoscope } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CitaListMobileProps {
  initialData: Cita[];
  initialPage: number;
  initialPageCount: number;
  from?: string;
  to?: string;
}

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "programada":
      return (
        <Badge
          variant="outline"
        >
          Programada
        </Badge>
      );
    case "atendida":
      return (
        <Badge
          variant="outline"
        >
          Atendida
        </Badge>
      );
    case "cancelada":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-300"
        >
          Cancelada
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

export default function CitaListMobile({
  initialData,
  initialPage,
  initialPageCount,
  from,
  to,
}: CitaListMobileProps) {
  const [citas, setCitas] = useState<Cita[]>(initialData);
  const [page, setPage] = useState<number>(initialPage);
  const [pageCount, setPageCount] = useState<number>(initialPageCount);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [citaToDelete, setCitaToDelete] = useState<Cita | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCitas(initialData);
    setPage(initialPage);
    setPageCount(initialPageCount);
  }, [initialData, initialPage, initialPageCount]);

  const filteredCitas = citas.filter((c) => {
    const pacienteNombre = c.paciente
      ? `${c.paciente.nombre} ${c.paciente.apellido}`.toLowerCase()
      : "";
    const medicoNombre = c.medico?.empleado
      ? `${c.medico.empleado.nombre} ${c.medico.empleado.apellido}`.toLowerCase()
      : "";
    const consultorioNombre = c.consultorio?.nombre?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return (
      pacienteNombre.includes(search) ||
      medicoNombre.includes(search) ||
      consultorioNombre.includes(search) ||
      c.estado.toLowerCase().includes(search)
    );
  });

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;
    setLoading(true);

    const res = await getCitas({ page: newPage, pageSize: 10, from, to });
    setCitas(res.data);
    setPage(res.page);
    setPageCount(res.pageCount);

    setLoading(false);
  };

  const handleCambiarEstado = async (citaId: string, nuevoEstado: string) => {
    try {
      const result = await cambiarEstadoCita(citaId, nuevoEstado);
      if (result.success) {
        toast.success("Estado actualizado", {
          description: `La cita ha sido marcada como ${nuevoEstado}.`,
        });
        // Refrescar datos
        const res = await getCitas({ page, pageSize: 10, from, to });
        setCitas(res.data);
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error || "No se pudo cambiar el estado.",
        });
      }
    } catch {
      toast.error("Error", {
        description: "Ocurrio un error inesperado.",
      });
    }
  };

  const handleDelete = async () => {
    if (!citaToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteCita(citaToDelete.id);
      if (result.success) {
        toast.success("Cita eliminada", {
          description: "La cita ha sido eliminada correctamente.",
        });
        const res = await getCitas({ page, pageSize: 10, from, to });
        setCitas(res.data);
        setPageCount(res.pageCount);
        router.refresh();
      } else {
        toast.error("Error al eliminar", {
          description: result.error || "No se pudo eliminar la cita.",
        });
      }
    } catch {
      toast.error("Error al eliminar", {
        description: "Ocurrio un error inesperado.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setCitaToDelete(null);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/citas/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nueva Cita
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por paciente, medico o consultorio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {filteredCitas.length > 0 ? (
          filteredCitas.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate">
                        {c.paciente
                          ? `${c.paciente.nombre} ${c.paciente.apellido}`
                          : "Paciente no asignado"}
                      </h3>
                      {getEstadoBadge(c.estado)}
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground truncate">
                            {c.fechaHora
                              ? format(new Date(c.fechaHora), "PPP p", {
                                  locale: es,
                                })
                              : "-"}{" "}
                            |{" "}
                            {c.medico?.empleado
                              ? `Dr. ${c.medico.empleado.nombre} ${c.medico.empleado.apellido}`
                              : "-"}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Fecha:{" "}
                            {c.fechaHora
                              ? format(new Date(c.fechaHora), "PPP p", {
                                  locale: es,
                                })
                              : "-"}{" "}
                            <br />
                            Medico:{" "}
                            {c.medico?.empleado
                              ? `${c.medico.empleado.nombre} ${c.medico.empleado.apellido}`
                              : "-"}{" "}
                            <br />
                            Consultorio: {c.consultorio?.nombre || "-"} <br />
                            Motivo: {c.motivo || "-"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <p className="text-xs text-muted-foreground">
                      {c.consultorio?.nombre || "Sin consultorio"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link href={`/citas/${c.id}/consulta`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        title="Consulta"
                      >
                        <Stethoscope className="h-4 w-4" />
                        <span className="sr-only">Consulta</span>
                      </Button>
                    </Link>
                    <Link href={`/citas/${c.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar cita</span>
                      </Button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Mas opciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                        {ESTADOS_CITA.filter((e) => e.value !== c.estado).map(
                          (estado) => (
                            <DropdownMenuItem
                              key={estado.value}
                              onClick={() =>
                                handleCambiarEstado(c.id!, estado.value)
                              }
                            >
                              {estado.label}
                            </DropdownMenuItem>
                          )
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setCitaToDelete(c);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 bg-muted/30 rounded-lg">
            <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No se encontraron citas.</p>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pageCount || loading}
          >
            Siguiente
          </Button>
        </div>
      )}

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
    </div>
  );
}
