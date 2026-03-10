"use client";

import { requestTenantAppointmentAction, type TenantAppointmentFormState } from "@/app/(public)/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

const initialState: TenantAppointmentFormState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full bg-cyan-600 text-white hover:bg-cyan-500" disabled={pending}>
      {pending ? "Enviando solicitud..." : "Solicitar cita"}
    </Button>
  );
}

export function TenantAppointmentForm() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(requestTenantAppointmentAction, initialState);

  const minDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setOpen(true);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      setSelectedDate(undefined);
    }
  }, [state.status]);

  const hiddenDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Selecciona un día y completa tus datos para solicitar tu cita.</p>

      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.message}</p> : null}

      <div className="flex justify-center rounded-xl border border-border bg-card p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => setSelectedDate(date)}
          disabled={(date) => date < minDate}
          showOutsideDays
          className="w-full"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar cita</DialogTitle>
            <DialogDescription>
              Fecha seleccionada: {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "sin fecha"}
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="appointmentDate" value={hiddenDate} />

            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required minLength={3} placeholder="Nombre completo" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" required minLength={7} placeholder="Tu número de contacto" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" required placeholder="tu@correo.com" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea id="reason" name="reason" required minLength={5} placeholder="Describe brevemente el motivo de la cita" rows={3} />
            </div>

            {state.status === "error" && state.message ? <p className="text-sm text-red-500">{state.message}</p> : null}

            <SubmitButton />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
