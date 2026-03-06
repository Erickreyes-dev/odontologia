"use client";

import { useState, useTransition } from "react";
import { createTenant } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type PaqueteOption = { id: string; nombre: string; maxUsuarios: number };

export default function CreateTenantForm({ paquetes }: { paquetes: PaqueteOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [tenantLoginUrl, setTenantLoginUrl] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = (formData: FormData) => {
    setError(null);
    setGeneratedPassword(null);
    setTenantLoginUrl(null);

    const passwordValue = String(formData.get("adminPassword") || "").trim();

    startTransition(async () => {
      const result = await createTenant({
        nombre: String(formData.get("nombre") || ""),
        slug: String(formData.get("slug") || ""),
        paqueteId: String(formData.get("paqueteId") || ""),
        adminNombre: String(formData.get("adminNombre") || ""),
        adminCorreo: String(formData.get("adminCorreo") || ""),
        adminUsuario: String(formData.get("adminUsuario") || ""),
        adminPassword: passwordValue || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setGeneratedPassword(result.adminPassword);
      setTenantLoginUrl(result.loginUrl);
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
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="paqueteId">Paquete</Label>
        <select id="paqueteId" name="paqueteId" className="w-full rounded-md border bg-background p-2" required>
          <option value="">Seleccione un paquete</option>
          {paquetes.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} · {p.maxUsuarios} usuarios</option>
          ))}
        </select>
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
      {tenantLoginUrl && (
        <p className="text-sm text-blue-400 md:col-span-2 break-all">
          URL de acceso del tenant: <a href={tenantLoginUrl} className="underline" target="_blank" rel="noreferrer">{tenantLoginUrl}</a>
        </p>
      )}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending || paquetes.length === 0}>
          {isPending ? "Creando..." : "Crear tenant + admin"}
        </Button>
      </div>
    </form>
  );
}
