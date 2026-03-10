"use client";

import { ChangeEvent, FormEvent, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TenantClinicProfile } from "../actions";
import { updateTenantClinicProfile } from "../actions";

interface MiClinicaFormProps {
  tenant: TenantClinicProfile;
  canEdit: boolean;
}

export default function MiClinicaForm({ tenant, canEdit }: MiClinicaFormProps) {
  const [telefono, setTelefono] = useState(tenant.telefono ?? "");
  const [correo, setCorreo] = useState(tenant.contactoCorreo ?? "");
  const [logoBase64, setLogoBase64] = useState(tenant.logoBase64 ?? "");
  const [mision, setMision] = useState(tenant.mision ?? "");
  const [vision, setVision] = useState(tenant.vision ?? "");
  const [serviciosInfo, setServiciosInfo] = useState(tenant.serviciosInfo ?? "");
  const [horariosInfo, setHorariosInfo] = useState(tenant.horariosInfo ?? "");
  const [redesSociales, setRedesSociales] = useState(tenant.redesSociales ?? "");
  const [isPending, startTransition] = useTransition();

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setLogoBase64("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Seleccione una imagen válida");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogoBase64(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateTenantClinicProfile({
        telefono,
        correo,
        logoBase64: logoBase64 || null,
        mision,
        vision,
        serviciosInfo,
        horariosInfo,
        redesSociales,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Información de la clínica actualizada");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información pública de la clínica</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={tenant.nombre} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Subdominio</Label>
              <Input id="slug" value={tenant.slug} disabled />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} disabled={!canEdit} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="correo">Correo</Label>
              <Input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} maxLength={150} disabled={!canEdit} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} disabled={!canEdit} />
            {logoBase64 && <Image src={logoBase64} alt="Logo de la clínica" width={80} height={80} className="h-20 w-20 rounded border object-cover" unoptimized />}
          </div>

          <div className="space-y-1">
            <Label htmlFor="mision">Misión</Label>
            <Textarea id="mision" value={mision} onChange={(e) => setMision(e.target.value)} rows={4} disabled={!canEdit} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="vision">Visión</Label>
            <Textarea id="vision" value={vision} onChange={(e) => setVision(e.target.value)} rows={4} disabled={!canEdit} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="serviciosInfo">Servicios</Label>
            <Textarea id="serviciosInfo" value={serviciosInfo} onChange={(e) => setServiciosInfo(e.target.value)} rows={4} disabled={!canEdit} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="horariosInfo">Horarios</Label>
            <Textarea id="horariosInfo" value={horariosInfo} onChange={(e) => setHorariosInfo(e.target.value)} rows={4} disabled={!canEdit} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="redesSociales">Redes sociales</Label>
            <Textarea id="redesSociales" value={redesSociales} onChange={(e) => setRedesSociales(e.target.value)} rows={4} disabled={!canEdit} />
          </div>

          {canEdit ? (
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar información"}
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
