"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlatformAdminUser } from "../actions";

export default function CreatePlatformAdminForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    setGeneratedPassword(null);

    startTransition(async () => {
      const result = await createPlatformAdminUser({
        usuario: String(formData.get("usuario") || ""),
        password: String(formData.get("password") || "").trim() || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setGeneratedPassword(result.generatedPassword);
    });
  };

  return (
    <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="usuario">Usuario administrador global</Label>
        <Input id="usuario" name="usuario" placeholder="owner.ops" required minLength={4} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña inicial (opcional)</Label>
        <Input id="password" name="password" type="password" placeholder="Se genera automática si se deja vacía" />
      </div>

      {error && <p className="text-sm text-red-500 md:col-span-2">{error}</p>}
      {generatedPassword && (
        <p className="text-sm text-emerald-600 md:col-span-2">
          Usuario global creado. Contraseña inicial: <strong>{generatedPassword}</strong>
        </p>
      )}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear admin global"}
        </Button>
      </div>
    </form>
  );
}
