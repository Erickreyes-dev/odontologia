"use client";

import { type RequestAccessFormState, requestAccessAction } from "@/app/(public)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";

const initialState: RequestAccessFormState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
      {pending ? "Enviando..." : "Pedir acceso"}
    </Button>
  );
}

export function RequestAccessForm() {
  const [state, formAction] = useFormState(requestAccessAction, initialState);

  return (
    <form action={formAction} className="mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
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

      {state.message ? (
        <p className={state.status === "success" ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
