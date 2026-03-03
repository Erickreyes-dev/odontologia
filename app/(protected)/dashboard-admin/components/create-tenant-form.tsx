"use client";

import { useState, useTransition } from "react";
import { createTenant } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function CreateTenantForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = (formData: FormData) => {
    setError(null);
    setGeneratedPassword(null);

    const passwordValue = String(formData.get("adminPassword") || "").trim();

    const payload = {
      nombre: String(formData.get("nombre") || ""),
      slug: String(formData.get("slug") || ""),
      plan: String(formData.get("plan") || "starter"),
      maxUsuarios: Number(formData.get("maxUsuarios") || 20),
      adminNombre: String(formData.get("adminNombre") || ""),
      adminCorreo: String(formData.get("adminCorreo") || ""),
      adminUsuario: String(formData.get("adminUsuario") || ""),
      adminPassword: passwordValue || undefined,
    };

    startTransition(async () => {
      const result = await createTenant(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setGeneratedPassword(result.adminPassword);
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre de clínica</Label>
        <Input id="nombre" name="nombre" placeholder="Clínica Sonrisa" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" placeholder="clinica-sonrisa" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="plan">Plan</Label>
        <Input id="plan" name="plan" defaultValue="starter" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxUsuarios">Max usuarios</Label>
        <Input id="maxUsuarios" name="maxUsuarios" type="number" min={1} defaultValue={20} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminNombre">Nombre administrador del tenant</Label>
        <Input id="adminNombre" name="adminNombre" placeholder="Dr. Juan Pérez" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminCorreo">Correo administrador</Label>
        <Input id="adminCorreo" name="adminCorreo" type="email" placeholder="admin@clinica.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminUsuario">Usuario administrador</Label>
        <Input id="adminUsuario" name="adminUsuario" placeholder="admin.clinica" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminPassword">Contraseña inicial (opcional)</Label>
        <Input id="adminPassword" name="adminPassword" type="password" placeholder="Se genera automática si la dejas vacía" />
      </div>

      {error && <p className="text-sm text-red-500 md:col-span-2">{error}</p>}
      {generatedPassword && (
        <p className="text-sm text-emerald-600 md:col-span-2">
          Tenant creado. Contraseña inicial del admin: <strong>{generatedPassword}</strong>
        </p>
      )}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear tenant + admin"}
        </Button>
      </div>
    </form>
  );
}
