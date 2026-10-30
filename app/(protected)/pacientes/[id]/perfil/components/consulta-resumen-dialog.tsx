"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, Pencil, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ConsultaResumen } from "@/app/(protected)/pacientes/actions";

const formatMoney = (value: number) =>
  `L. ${value.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

function TextSection({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
        {value?.trim() ? value : "Sin registrar"}
      </p>
    </div>
  );
}

interface ConsultaResumenDialogProps {
  fechaCita: Date | null;
  medicoNombre: string | null;
  consulta?: ConsultaResumen;
  triggerSize: "sm" | "icon";
}

export function ConsultaResumenDialog({
  fechaCita,
  medicoNombre,
  consulta,
  triggerSize,
}: ConsultaResumenDialogProps) {
  if (!consulta) {
    return (
      <span title="Sin consulta registrada">
        <Button variant="ghost" size={triggerSize} disabled aria-label="Sin consulta registrada">
          <Eye className="h-4 w-4" />
        </Button>
      </span>
    );
  }

  const fecha = consulta.fechaConsulta ?? fechaCita;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size={triggerSize} title="Ver consulta" aria-label="Ver consulta">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Consulta
          </DialogTitle>
          <DialogDescription>
            {fecha ? format(new Date(fecha), "PPP p", { locale: es }) : "Sin fecha"}
            {medicoNombre ? ` | Dr. ${medicoNombre}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <TextSection label="Diagnóstico" value={consulta.diagnostico} />
          <TextSection label="Observaciones clínicas" value={consulta.observacionesClinicas} />
          <TextSection label="Notas" value={consulta.notas} />

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Servicios realizados</p>
            {consulta.servicios.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consulta.servicios.map((servicio) => (
                      <TableRow key={servicio.id}>
                        <TableCell>{servicio.nombre}</TableCell>
                        <TableCell className="text-right">{servicio.cantidad}</TableCell>
                        <TableCell className="text-right">{formatMoney(servicio.precioAplicado)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin servicios registrados</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Productos utilizados</p>
            {consulta.productos.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consulta.productos.map((producto) => (
                      <TableRow key={producto.id}>
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell className="text-right">{producto.cantidad}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin productos registrados</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Piezas tratadas</p>
            {consulta.piezasTratadas.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {consulta.piezasTratadas.map((pieza) => (
                  <Badge key={pieza} variant="outline">
                    {pieza}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin piezas registradas</p>
            )}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-sm">
            {consulta.descuento ? (
              <span className="text-muted-foreground">Descuento: {consulta.descuento}%</span>
            ) : null}
            <span className="font-semibold">Total: {formatMoney(consulta.total)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Link href={`/citas/${consulta.citaId}/edit`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Editar cita
            </Button>
          </Link>
          <Link href={`/citas/${consulta.citaId}/consulta`}>
            <Button className="w-full sm:w-auto">
              <Stethoscope className="mr-2 h-4 w-4" />
              Abrir consulta completa
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
