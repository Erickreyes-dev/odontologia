"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Eye, Pencil, Plus, Search, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useState } from "react";
import { PlanTratamiento, ESTADOS_PLAN } from "../schema";

interface PlanListMobileProps {
  planes: PlanTratamiento[];
}

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

export function PlanListMobile({ planes }: PlanListMobileProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlanes = planes.filter(
    (plan) =>
      plan.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.pacienteNombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search and Add Button */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/planes-tratamiento/create">
          <Button className="w-full flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Plan
          </Button>
        </Link>
      </div>

      {/* Plans List */}
      {filteredPlanes.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron planes de tratamiento"
                  : "No hay planes de tratamiento registrados"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPlanes.map((plan) => {
            const total = plan.totalSeguimientos || 0;
            const completados = plan.seguimientosCompletados || 0;
            const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

            return (
              <Card key={plan.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{plan.nombre}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.pacienteNombre}
                      </p>
                    </div>
                    {getEstadoBadge(plan.estado)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.descripcion}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Inicio:</span>
                    <span>
                      {plan.fechaInicio
                        ? format(new Date(plan.fechaInicio), "PPP", { locale: es })
                        : "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Etapas:</span>
                    <span>{plan.totalEtapas || 0}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso:</span>
                      <span>{completados}/{total} seguimientos</span>
                    </div>
                    <Progress value={porcentaje} className="h-2" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/planes-tratamiento/${plan.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                    {plan.estado === "ACTIVO" && (
                      <Link href={`/planes-tratamiento/${plan.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
