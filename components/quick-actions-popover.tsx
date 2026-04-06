"use client";

import { useState, useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { quickCreateCita, quickCreateCotizacion, quickCreatePaciente } from "@/app/(protected)/quick-actions/actions";
import { Zap } from "lucide-react";

type CatalogData = {
  pacientes: { id: string; nombre: string; apellido: string }[];
  medicos: { idEmpleado: string; empleado: { nombre: string; apellido: string } | null }[];
  consultorios: { id: string; nombre: string }[];
};

export function QuickActionsPopover({ data }: { data: CatalogData }) {
  const [dialog, setDialog] = useState<"cita" | "paciente" | "cotizacion" | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="max-w-full">
            <Zap className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Accesos rápidos</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setDialog("cita")}>Agendar cita</Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setDialog("paciente")}>Crear paciente</Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setDialog("cotizacion")}>Crear cotización</Button>
        </PopoverContent>
      </Popover>

      <Dialog open={dialog === "paciente"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo paciente</DialogTitle></DialogHeader>
          <form action={(fd) => { startTransition(async () => {
            const res = await quickCreatePaciente({
              nombre: String(fd.get("nombre") || ""),
              apellido: String(fd.get("apellido") || ""),
              identidad: String(fd.get("identidad") || ""),
              telefono: String(fd.get("telefono") || ""),
            });
            if (!res.success) { toast.error(res.error); return; }
            toast.success("Paciente creado");
            setDialog(null);
          }); }} className="space-y-3">
            <Label>Nombre</Label><Input name="nombre" required />
            <Label>Apellido</Label><Input name="apellido" required />
            <Label>Identidad</Label><Input name="identidad" required />
            <Label>Teléfono</Label><Input name="telefono" />
            <Button disabled={isPending} type="submit" className="w-full">Guardar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "cita"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agendar cita</DialogTitle></DialogHeader>
          <form action={(fd) => { startTransition(async () => {
            const res = await quickCreateCita({
              pacienteId: String(fd.get("pacienteId")),
              medicoId: String(fd.get("medicoId")),
              consultorioId: String(fd.get("consultorioId")),
              fechaHora: String(fd.get("fechaHora")),
              motivo: String(fd.get("motivo") || ""),
            });
            if (!res.success) { toast.error(res.error); return; }
            toast.success("Cita creada");
            setDialog(null);
          }); }} className="space-y-3">
            <Label>Paciente</Label>
            <select name="pacienteId" className="w-full rounded-md border px-3 py-2" required>{data.pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select>
            <Label>Médico</Label>
            <select name="medicoId" className="w-full rounded-md border px-3 py-2" required>{data.medicos.map((m) => <option key={m.idEmpleado} value={m.idEmpleado}>{m.empleado?.nombre} {m.empleado?.apellido}</option>)}</select>
            <Label>Consultorio</Label>
            <select name="consultorioId" className="w-full rounded-md border px-3 py-2" required>{data.consultorios.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
            <Label>Fecha y hora</Label><Input name="fechaHora" type="datetime-local" required />
            <Label>Motivo</Label><Input name="motivo" />
            <Button disabled={isPending} type="submit" className="w-full">Guardar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "cotizacion"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear cotización</DialogTitle></DialogHeader>
          <form action={(fd) => { startTransition(async () => {
            const res = await quickCreateCotizacion({
              pacienteId: String(fd.get("pacienteId")),
              total: Number(fd.get("total") || 0),
              observacion: String(fd.get("observacion") || ""),
            });
            if (!res.success) { toast.error(res.error); return; }
            toast.success("Cotización creada");
            setDialog(null);
          }); }} className="space-y-3">
            <Label>Paciente</Label>
            <select name="pacienteId" className="w-full rounded-md border px-3 py-2" required>{data.pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select>
            <Label>Total</Label><Input name="total" type="number" min="0" step="0.01" required />
            <Label>Observación</Label><Input name="observacion" />
            <Button disabled={isPending} type="submit" className="w-full">Guardar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
