"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import type { TenantClinicProfile, TenantClinicScheduleItem } from "../actions";
import { updateTenantClinicProfile } from "../actions";

interface MiClinicaFormProps {
  tenant: TenantClinicProfile;
  canEdit: boolean;
}

const DEFAULT_SCHEDULE: TenantClinicScheduleItem[] = [
  { dia: "Lunes", cerrado: false, abre: "08:00", cierra: "17:00" },
  { dia: "Martes", cerrado: false, abre: "08:00", cierra: "17:00" },
  { dia: "Miércoles", cerrado: false, abre: "08:00", cierra: "17:00" },
  { dia: "Jueves", cerrado: false, abre: "08:00", cierra: "17:00" },
  { dia: "Viernes", cerrado: false, abre: "08:00", cierra: "17:00" },
  { dia: "Sábado", cerrado: true, abre: "", cierra: "" },
  { dia: "Domingo", cerrado: true, abre: "", cierra: "" },
];

function parseSchedule(value: string | null): TenantClinicScheduleItem[] {
  if (!value) return DEFAULT_SCHEDULE;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_SCHEDULE;

    return parsed.map((item, index) => ({
      dia: typeof item.dia === "string" ? item.dia : DEFAULT_SCHEDULE[index]?.dia ?? "Día",
      cerrado: Boolean(item.cerrado),
      abre: typeof item.abre === "string" ? item.abre : "",
      cierra: typeof item.cierra === "string" ? item.cierra : "",
    }));
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export default function MiClinicaForm({ tenant, canEdit }: MiClinicaFormProps) {
  const [telefono, setTelefono] = useState(tenant.telefono ?? "");
  const [correo, setCorreo] = useState(tenant.contactoCorreo ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(tenant.logoUrl ?? "");
  const [logoDeleted, setLogoDeleted] = useState(false);
  const [landingImageFile, setLandingImageFile] = useState<File | null>(null);
  const [landingImagePreview, setLandingImagePreview] = useState(tenant.landingImageUrl ?? "");
  const [landingImageDeleted, setLandingImageDeleted] = useState(false);
  const [mision, setMision] = useState(tenant.mision ?? "");
  const [vision, setVision] = useState(tenant.vision ?? "");
  const [horarios, setHorarios] = useState<TenantClinicScheduleItem[]>(() => parseSchedule(tenant.horariosJson));
  const [facebookUrl, setFacebookUrl] = useState(tenant.facebookUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(tenant.twitterUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(tenant.instagramUrl ?? "");
  const [whatsappUrl, setWhatsappUrl] = useState(tenant.whatsappUrl ?? "");
  const [isPending, startTransition] = useTransition();

  // Sincronizar el estado interno cuando los datos del servidor cambian
  useEffect(() => {
    setTelefono(tenant.telefono ?? "");
    setCorreo(tenant.contactoCorreo ?? "");
    setLogoPreview(tenant.logoUrl ?? "");
    setLandingImagePreview(tenant.landingImageUrl ?? "");
    setMision(tenant.mision ?? "");
    setVision(tenant.vision ?? "");
    setFacebookUrl(tenant.facebookUrl ?? "");
    setTwitterUrl(tenant.twitterUrl ?? "");
    setInstagramUrl(tenant.instagramUrl ?? "");
    setWhatsappUrl(tenant.whatsappUrl ?? "");
    setHorarios(parseSchedule(tenant.horariosJson));
    setLogoFile(null);
    setLandingImageFile(null);
    setLogoDeleted(false);
    setLandingImageDeleted(false);
  }, [tenant]);

  const horariosOrdenados = useMemo(() => horarios, [horarios]);

  const updateHorario = (index: number, data: Partial<TenantClinicScheduleItem>) => {
    setHorarios((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...data } : item));
  };

  const addHorario = () => {
    setHorarios((current) => [...current, { dia: "", cerrado: false, abre: "08:00", cierra: "17:00" }]);
  };

  const removeHorario = (index: number) => {
    setHorarios((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const copyTenantUrl = async () => {
    try {
      await navigator.clipboard.writeText(tenant.tenantUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setLogoFile(null);
      setLogoPreview(logoDeleted ? "" : (tenant.logoUrl ?? ""));
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Seleccione una imagen válida");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoDeleted(false);
  };

  const handleDeleteLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setLogoDeleted(true);
    const input = document.getElementById("logo") as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleLandingImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setLandingImageFile(null);
      setLandingImagePreview(landingImageDeleted ? "" : (tenant.landingImageUrl ?? ""));
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Seleccione una imagen válida");
      return;
    }

    setLandingImageFile(file);
    setLandingImagePreview(URL.createObjectURL(file));
    setLandingImageDeleted(false);
  };

  const handleDeleteLandingImage = () => {
    setLandingImageFile(null);
    setLandingImagePreview("");
    setLandingImageDeleted(true);
    const input = document.getElementById("landingImage") as HTMLInputElement;
    if (input) input.value = "";
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.append("telefono", telefono);
      formData.append("correo", correo);
      if (logoFile) {
        formData.append("logoFile", logoFile);
      }
      if (landingImageFile) {
        formData.append("landingImageFile", landingImageFile);
      }
      formData.append("deleteLogo", logoDeleted ? "true" : "false");
      formData.append("deleteLandingImage", landingImageDeleted ? "true" : "false");
      formData.append("mision", mision);
      formData.append("vision", vision);
      formData.append("horarios", JSON.stringify(horarios));
      formData.append("facebookUrl", facebookUrl);
      formData.append("twitterUrl", twitterUrl);
      formData.append("instagramUrl", instagramUrl);
      formData.append("whatsappUrl", whatsappUrl);

      const result = await updateTenantClinicProfile(formData);

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
        <form className="space-y-6" onSubmit={onSubmit}>
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

          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="tenantUrl">Enlace público para compartir</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="tenantUrl" value={tenant.tenantUrl} readOnly />
              <Button type="button" variant="outline" onClick={copyTenantUrl}>Copiar enlace</Button>
            </div>
            <p className="text-xs text-muted-foreground">Comparte este enlace para que tus pacientes vean tu landing y soliciten citas.</p>
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

          <div className="space-y-2">
            <Label htmlFor="logo">Logo de la clínica</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative group h-20 w-20 rounded border overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Image src={logoPreview} alt="Logo de la clínica" width={80} height={80} className="h-20 w-20 object-cover" unoptimized />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                      title="Eliminar logo"
                    >
                      <Trash2 className="size-5 text-red-500 hover:scale-110 transition-transform" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-20 w-20 rounded border border-dashed flex items-center justify-center text-muted-foreground text-[10px] bg-neutral-50/50 dark:bg-neutral-900/50">
                  Sin logo
                </div>
              )}
              {canEdit && (
                <div className="flex-1">
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="max-w-xs" />
                  <p className="text-[10px] text-muted-foreground mt-1">Soporta PNG, JPEG, WEBP de hasta 2MB.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landingImage">Imagen de la landing</Label>
            <div className="flex flex-col gap-3">
              {landingImagePreview ? (
                <div className="relative group w-full max-w-xl aspect-[2/1] rounded border overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Image src={landingImagePreview} alt="Imagen de landing de la clínica" width={512} height={256} className="w-full h-full object-cover" unoptimized />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleDeleteLandingImage}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                      title="Eliminar imagen de landing"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Trash2 className="size-6 text-red-500 hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium text-red-500">Eliminar imagen</span>
                      </div>
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-xl aspect-[2/1] rounded border border-dashed flex items-center justify-center text-muted-foreground text-xs bg-neutral-50/50 dark:bg-neutral-900/50">
                  Sin imagen de landing
                </div>
              )}
              {canEdit && (
                <div className="flex items-center gap-3">
                  <Input id="landingImage" type="file" accept="image/*" onChange={handleLandingImageChange} className="max-w-xs" />
                  <p className="text-[10px] text-muted-foreground">Tamaño máximo: 2 MB.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="mision">Misión</Label>
              <Textarea id="mision" value={mision} onChange={(e) => setMision(e.target.value)} rows={4} disabled={!canEdit} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vision">Visión</Label>
              <Textarea id="vision" value={vision} onChange={(e) => setVision(e.target.value)} rows={4} disabled={!canEdit} />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Horarios de atención</h3>
                <p className="text-sm text-muted-foreground">Configura cada día y marca cerrado cuando aplique.</p>
              </div>
              {canEdit ? <Button type="button" variant="outline" onClick={addHorario}>Agregar horario</Button> : null}
            </div>
            <div className="space-y-3">
              {horariosOrdenados.map((horario, index) => (
                <div key={`${horario.dia}-${index}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1.2fr_auto_1fr_1fr_auto] md:items-end">
                  <div className="space-y-1">
                    <Label>Día</Label>
                    <Input value={horario.dia} onChange={(e) => updateHorario(index, { dia: e.target.value })} disabled={!canEdit} />
                  </div>
                  <label className="flex items-center gap-2 text-sm md:pb-2">
                    <input type="checkbox" checked={horario.cerrado} onChange={(e) => updateHorario(index, { cerrado: e.target.checked })} disabled={!canEdit} />
                    Cerrado
                  </label>
                  <div className="space-y-1">
                    <Label>Abre</Label>
                    <Input type="time" value={horario.abre} onChange={(e) => updateHorario(index, { abre: e.target.value })} disabled={!canEdit || horario.cerrado} />
                  </div>
                  <div className="space-y-1">
                    <Label>Cierra</Label>
                    <Input type="time" value={horario.cierra} onChange={(e) => updateHorario(index, { cierra: e.target.value })} disabled={!canEdit || horario.cerrado} />
                  </div>
                  {canEdit ? <Button type="button" variant="outline" onClick={() => removeHorario(index)}>Quitar</Button> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="facebookUrl">Facebook</Label>
              <Input id="facebookUrl" type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/tu-clinica" disabled={!canEdit} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="twitterUrl">Twitter / X</Label>
              <Input id="twitterUrl" type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/tu-clinica" disabled={!canEdit} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input id="instagramUrl" type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/tu-clinica" disabled={!canEdit} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="whatsappUrl">WhatsApp</Label>
              <Input id="whatsappUrl" type="url" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} placeholder="https://wa.me/50499999999" disabled={!canEdit} />
            </div>
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
