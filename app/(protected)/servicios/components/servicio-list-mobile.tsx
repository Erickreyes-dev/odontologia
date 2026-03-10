"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Search } from "lucide-react";
import type { Servicio } from "../schema";

interface ServicioListMobileProps {
  servicios: Servicio[];
}

export default function ServicioListMobile({ servicios }: ServicioListMobileProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServicios = servicios.filter((servicio) => {
    const term = searchTerm.toLowerCase();
    return (
      servicio.nombre.toLowerCase().includes(term) ||
      servicio.descripcion?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <Link href="/servicios/create" className="w-full sm:w-auto">
        <Button className="w-full sm:w-auto flex items-center gap-2">
          Nuevo Servicio
          <Plus className="h-4 w-4" />
        </Button>
      </Link>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar servicio..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {filteredServicios.length > 0 ? (
          filteredServicios.map((servicio) => (
            <Card key={servicio.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{servicio.nombre}</h3>
                    <Badge variant={servicio.activo ? "default" : "destructive"} className="text-xs">
                      {servicio.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant={servicio.mostrarEnLanding ? "default" : "secondary"} className="text-xs">
                      {servicio.mostrarEnLanding ? "En landing" : "Fuera de landing"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {servicio.descripcion || "Sin descripción"}
                  </p>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                    <span>Precio: L. {servicio.precioBase.toFixed(2)}</span>
                    <span>Duración: {servicio.duracionMin} min</span>
                  </div>
                </div>

                <Link href={`/servicios/${servicio.id}/edit`} className="shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar servicio</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron servicios.
          </div>
        )}
      </div>

      {filteredServicios.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredServicios.length} de {servicios.length} servicios.
        </p>
      )}
    </div>
  );
}
