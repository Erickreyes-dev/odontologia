"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Search } from "lucide-react";
import type { Producto } from "../schema";

interface InventarioListMobileProps {
  productos: Producto[];
}

const getStockBadge = (stock: number, stockMinimo: number) => {
  if (stock <= stockMinimo) {
    return <Badge variant="destructive">Bajo</Badge>;
  }
  return <Badge variant="secondary">Ok</Badge>;
};

export default function InventarioListMobile({ productos }: InventarioListMobileProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProductos = productos.filter((producto) => {
    const term = searchTerm.toLowerCase();
    return (
      producto.nombre.toLowerCase().includes(term) ||
      producto.descripcion?.toLowerCase().includes(term) ||
      producto.unidad?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <Link href="/inventario/create" className="w-full sm:w-auto">
        <Button className="w-full sm:w-auto flex items-center gap-2">
          Nuevo Producto
          <Plus className="h-4 w-4" />
        </Button>
      </Link>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {filteredProductos.length > 0 ? (
          filteredProductos.map((producto) => (
            <Card key={producto.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{producto.nombre}</h3>
                    <Badge variant={producto.activo ? "default" : "destructive"} className="text-xs">
                      {producto.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    {getStockBadge(producto.stock, producto.stockMinimo)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {producto.descripcion || "Sin descripción"}
                  </p>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                    <span>Stock: {producto.stock}</span>
                    <span>Mínimo: {producto.stockMinimo}</span>
                    <span>Tipo: {producto.tipo === "VENTA" ? "Venta" : "Consumible"}</span>
                    {producto.tipo === "VENTA" ? (
                      <span>Precio: L {Number(producto.precioVenta ?? 0).toFixed(2)}</span>
                    ) : null}
                    {producto.unidad && <span>Unidad: {producto.unidad}</span>}
                  </div>
                </div>

                <Link href={`/inventario/${producto.id}/edit`} className="shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar producto</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron productos.
          </div>
        )}
      </div>

      {filteredProductos.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredProductos.length} de {productos.length} productos.
        </p>
      )}
    </div>
  );
}
