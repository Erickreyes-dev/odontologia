"use client";

import { Info, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Paciente } from "../schema";
import { calcularEdad } from "@/lib/utils";

interface PacienteListMobileProps {
  pacientes: Paciente[];
}

export default function PacienteListMobile({ pacientes }: PacienteListMobileProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.identidad?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Botón de crear paciente */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href={`/pacientes/create`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Paciente
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
          filteredPacientes.map((paciente) => {
            const edad = paciente.fechaNacimiento ? calcularEdad(new Date(paciente.fechaNacimiento)) : null;

            return (
              <Card key={paciente.id}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{`${paciente.nombre} ${paciente.apellido}`}</h3>
                        <Badge variant={paciente.activo ? "default" : "destructive"} className="text-xs">
                          {paciente.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground truncate">
                              {paciente.identidad || "Sin identidad"} · {paciente.genero || "Sin género"} · {edad !== null ? `${edad} años` : "-"}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Identidad: {paciente.identidad || "-"} <br />
                              Género: {paciente.genero || "-"} <br />
                              {paciente.fechaNacimiento
                                ? new Date(paciente.fechaNacimiento).toLocaleDateString()
                                : "-"}
                              Edad: {edad !== null ? `${edad} años` : "-"} <br />
                              Teléfono: {paciente.telefono || "-"} <br />
                              Correo: {paciente.correo || "-"} <br />
                              Dirección: {paciente.direccion || "-"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <Link href={`/pacientes/${paciente.id}/edit`} className="ml-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar paciente</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-10 bg-muted/30 rounded-lg">
            <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No se encontraron pacientes.</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? "Intenta con otra búsqueda." : "Crea un nuevo paciente para comenzar."}
            </p>
          </div>
        )}
      </div>

      {filteredPacientes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredPacientes.length} de {pacientes.length} pacientes
        </p>
      )}
    </div>
  );
}
