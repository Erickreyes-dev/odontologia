"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { OrdenCobroWithRelations } from "../schema";

interface OrdenesCobroListMobileProps {
  ordenes: OrdenCobroWithRelations[];
  onAnular?: (id: string) => void;
}

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "PENDIENTE":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800">
          Pendiente
        </Badge>
      );
    case "PAGADA":
      return (
        <Badge className="bg-green-100 text-green-800 border border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800">
          Pagada
        </Badge>
      );
    case "ANULADA":
      return (
        <Badge className="bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700">
          Anulada
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

export default function OrdenesCobroListMobile({ ordenes, onAnular }: OrdenesCobroListMobileProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrdenes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return ordenes.filter((orden) => {
      return (
        orden.pacienteNombre?.toLowerCase().includes(term) ||
        orden.concepto.toLowerCase().includes(term) ||
        orden.estado.toLowerCase().includes(term)
      );
    });
  }, [ordenes, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar orden de cobro..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {filteredOrdenes.length > 0 ? (
          filteredOrdenes.map((orden) => (
            <Card key={orden.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate">{orden.pacienteNombre ?? "Paciente"}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{orden.concepto}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(orden.fechaEmision), "PPP", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="font-mono font-medium">L. {orden.monto.toFixed(2)}</p>
                    {getEstadoBadge(orden.estado)}
                  </div>
                </div>

                {orden.estado === "PENDIENTE" && onAnular && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => onAnular(orden.id)}>
                      Anular
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay órdenes de cobro para mostrar.
          </div>
        )}
      </div>

      {filteredOrdenes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredOrdenes.length} de {ordenes.length} órdenes.
        </p>
      )}
    </div>
  );
}
