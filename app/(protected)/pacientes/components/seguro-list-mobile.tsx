"use client";

import { useState } from "react";
import { getPacientes } from "../actions";
import { Paciente } from "../schema";
import { calcularEdad } from "@/lib/utils";
import { Info, Pencil, Plus, Search, CalendarPlus, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PacienteListMobileProps {
  initialData: Paciente[];
  initialPage: number;
  initialPageCount: number;
}

export default function PacienteListMobile({ initialData, initialPage, initialPageCount }: PacienteListMobileProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>(initialData);
  const [page, setPage] = useState<number>(initialPage);
  const [pageCount, setPageCount] = useState<number>(initialPageCount);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.identidad?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
  );

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;
    setLoading(true);

    const res = await getPacientes({ page: newPage, pageSize: 10 });
    setPacientes(res.data);
    setPage(res.page);
    setPageCount(res.pageCount);

    setLoading(false);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Crear paciente */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/pacientes/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo Paciente
          </Button>
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por nombre, apellido o identidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Lista de pacientes */}
      <div className="space-y-3">
        {filteredPacientes.length > 0 ? (
          filteredPacientes.map((p) => {
            const edad = p.fechaNacimiento ? calcularEdad(new Date(p.fechaNacimiento)) : null;
            return (
              <Card key={p.id}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{`${p.nombre} ${p.apellido}`}</h3>
                        <Badge variant={p.activo ? "default" : "destructive"} className="text-xs">
                          {p.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground truncate">
                              {p.identidad || "-"} · {p.genero || "-"} · {edad !== null ? `${edad} años` : "-"}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Identidad: {p.identidad || "-"} <br />
                              Género: {p.genero || "-"} <br />
                              {p.fechaNacimiento ? new Date(p.fechaNacimiento).toLocaleDateString() : "-"} <br />
                              Edad: {edad !== null ? `${edad} años` : "-"} <br />
                              Teléfono: {p.telefono || "-"} <br />
                              Correo: {p.correo || "-"} <br />
                              Dirección: {p.direccion || "-"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <Link href={`/pacientes/${p.id}/perfil`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <User className="h-4 w-4" />
                          <span className="sr-only">Ver perfil</span>
                        </Button>
                      </Link>
                      <Link href={`/pacientes/${p.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar paciente</span>
                        </Button>
                      </Link>
                      <Link href={`/citas/create?pacienteId=${p.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <CalendarPlus className="h-4 w-4" />
                          <span className="sr-only">Agendar cita</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-10 bg-muted/30 rounded-lg">
            <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No se encontraron pacientes.</p>
          </div>
        )}
      </div>

      {/* Paginación */}
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
            Página {page} de {pageCount}
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
    </div>
  );
}
