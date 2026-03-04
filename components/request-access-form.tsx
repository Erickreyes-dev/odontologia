"use client";

import { type RequestAccessFormState, requestAccessAction } from "@/app/(public)/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

const initialState: RequestAccessFormState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
      {pending ? "Enviando..." : "Enviar solicitud"}
    </Button>
  );
}

export function RequestAccessForm() {
  const [state, formAction] = useFormState(requestAccessAction, initialState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-slate-900/80 to-slate-950 p-8 shadow-xl shadow-cyan-900/20">
      <p className="max-w-xl text-sm text-slate-300">
        Cuéntanos sobre tu clínica y uno de nuestros asesores se pondrá en contacto contigo para activar tu acceso.
      </p>

      {state.status === "success" && state.message ? <p className="text-sm text-emerald-300">{state.message}</p> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="min-w-48 bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            Obtener acceso
          </Button>
        </DialogTrigger>

        <DialogContent className="border-slate-700 bg-slate-950/95 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicita tu acceso</DialogTitle>
            <DialogDescription className="text-slate-400">
              Completa tus datos y te contactaremos para continuar con la activación.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required minLength={3} placeholder="Tu nombre completo" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" required placeholder="tu@correo.com" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" required minLength={7} placeholder="Tu número de contacto" />
            </div>

            {state.status === "error" && state.message ? <p className="text-sm text-red-300">{state.message}</p> : null}

            <SubmitButton />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
