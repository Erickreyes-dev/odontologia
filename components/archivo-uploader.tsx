"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mediaUrl } from "@/lib/s3-storage";

type Archivo = { id: string; nombre: string; key: string; mimeType?: string | null; size?: number | null; createAt?: Date | string };

export function ArchivoUploader({ title, folder, ownerId, initialArchivos, onRegister, onDelete }: {
  title: string;
  folder: "consultas" | "pacientes";
  ownerId: string;
  initialArchivos: Archivo[];
  onRegister: (input: { ownerId: string; nombre: string; key: string; mimeType?: string; size?: number }) => Promise<{ success: true; archivo: Archivo } | { success: false; error: string }>;
  onDelete: (id: string) => Promise<{ success: true } | { success: false; error: string }>;
}) {
  const [archivos, setArchivos] = useState(initialArchivos);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const presignResponse = await fetch(`/api/uploads/${folder}?presign=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
    });
    const presigned = await presignResponse.json();
    if (!presignResponse.ok) throw new Error(presigned.error || "No se pudo preparar la subida");

    const putResponse = await fetch(presigned.url, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
    if (!putResponse.ok) throw new Error("No se pudo subir el archivo a S3");

    const result = await onRegister({ ownerId, nombre: file.name, key: presigned.key, mimeType: file.type, size: file.size });
    if (!result.success) throw new Error(result.error);
    setArchivos((current) => [result.archivo, ...current]);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> {title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input ref={inputRef} type="file" multiple accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" disabled={isPending} />
          <Button type="button" disabled={isPending} onClick={() => {
            const files = Array.from(inputRef.current?.files ?? []);
            if (!files.length) return toast.info("Seleccione al menos un archivo");
            startTransition(async () => {
              try {
                for (const file of files) await upload(file);
                if (inputRef.current) inputRef.current.value = "";
                toast.success("Archivos subidos");
              } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo subir"); }
            });
          }}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Subir</Button>
        </div>
        <div className="space-y-2">
          {archivos.length ? archivos.map((archivo) => (
            <div key={archivo.id} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
              <span className="truncate">{archivo.nombre}</span>
              <div className="flex gap-1">
                <Button asChild type="button" variant="ghost" size="sm"><a href={mediaUrl(archivo.key) ?? "#"} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => startTransition(async () => { const result = await onDelete(archivo.id); if (result.success) setArchivos((c) => c.filter((a) => a.id !== archivo.id)); else toast.error(result.error); })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">Sin archivos adjuntos.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
