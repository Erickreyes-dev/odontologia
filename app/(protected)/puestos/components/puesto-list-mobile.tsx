"use client"

import { Info, Pencil, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Puesto } from "../schema"



interface PuestoListProps {
  puesto: Puesto[]
}

export default function PuestoList({ puesto: puestos }: PuestoListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPuestos = puestos.filter(
    (puesto) =>
      puesto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puesto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <Link href={`/puestos/create`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo puesto
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {filteredPuestos.length > 0 ? (
          filteredPuestos.map((puesto) => (
            <Card
              key={puesto.id}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{puesto.nombre}</h3>
                      <Badge variant={puesto.activo ? "default" : "destructive"} className="text-xs">
                        {puesto.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground truncate">
                            {puesto.descripcion || "Sin descripción"}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{puesto.descripcion || "Sin descripción"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Link href={`/puestos/${puesto.id}/edit`} className="ml-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar puesto</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 bg-muted/30 rounded-lg">
            <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No se encontraron puestos de trabajo.</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? "Intenta con otra búsqueda." : "Crea un nuevo puesto para comenzar."}
            </p>
          </div>
        )}
      </div>

      {filteredPuestos.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredPuestos.length} de {puestos.length} puestos
        </p>
      )}
    </div>
  )
}
