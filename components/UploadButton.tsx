"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { toast } from "sonner";
import { UploadCloud, FileImage, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AllowedFolders = "logos" | "imagenes" | "perfiles" | "ventas" | "documentos" | "notas";

interface UploadButtonProps {
  folder: AllowedFolders;
  onUploadSuccess?: (data: { key: string; url: string; nombre: string }) => void;
  className?: string;
}

export function UploadButton({ folder, onUploadSuccess, className }: UploadButtonProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"server" | "presigned">("server");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar la selección manual del archivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  // Procesar archivo seleccionado o arrastrado
  const processFile = (selectedFile: File) => {
    // Validar tipo de archivo
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de tipo imagen (JPEG, PNG, WEBP, etc.)");
      return;
    }

    // Validar tamaño de archivo (e.g. 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("El tamaño del archivo supera el límite de 5MB");
      return;
    }

    setFile(selectedFile);

    // Generar URL de vista previa local
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  // Manejadores de Drag & Drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  // Resetear el estado
  const resetUpload = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Ejecutar subida
  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const toastId = toast.loading("Subiendo imagen a S3...");

    try {
      if (uploadMethod === "server") {
        // --- Método A: Envío estándar mediante FormData al Servidor de Next.js ---
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/uploads/${folder}`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al subir al servidor");

        toast.success("¡Imagen subida con éxito mediante el servidor!", { id: toastId });
        if (onUploadSuccess) {
          onUploadSuccess({ key: data.key, url: data.url, nombre: data.nombre });
        }
      } else {
        // --- Método B: Subida directa a S3 utilizando URL Firmada (Presigned URL) ---
        // 1. Obtener la URL firmada desde nuestro backend
        const presignResponse = await fetch(`/api/uploads/${folder}?presign=true`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        });

        const presignData = await presignResponse.json();
        if (!presignResponse.ok) throw new Error(presignData.error || "Error al generar la URL firmada");

        const { url: presignedUrl, key, name } = presignData;

        // 2. Subir directamente el archivo a S3 usando el PUT command firmada
        const s3Response = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!s3Response.ok) {
          throw new Error("No se pudo cargar el archivo directamente al bucket de S3");
        }

        // Construir la URL pública aproximada
        const publicUrl = presignedUrl.split("?")[0];

        toast.success("¡Imagen subida con éxito de forma directa a S3!", { id: toastId });
        if (onUploadSuccess) {
          onUploadSuccess({ key, url: publicUrl, nombre: name });
        }
      }

      resetUpload();
    } catch (error) {
      console.error("Error en la subida:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar la subida del archivo", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4 w-full max-w-md mx-auto p-4 rounded-xl border bg-card text-card-foreground shadow-sm", className)}>
      {/* Selector de Método de Subida (Avanzado/Premium look) */}
      <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg text-xs font-semibold gap-1">
        <button
          type="button"
          onClick={() => setUploadMethod("server")}
          className={cn(
            "flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1",
            uploadMethod === "server" ? "bg-white dark:bg-neutral-800 shadow text-neutral-900 dark:text-neutral-50" : "text-neutral-500 hover:text-neutral-800"
          )}
        >
          Servidor Next.js
        </button>
        <button
          type="button"
          onClick={() => setUploadMethod("presigned")}
          className={cn(
            "flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1",
            uploadMethod === "presigned" ? "bg-white dark:bg-neutral-800 shadow text-neutral-900 dark:text-neutral-50" : "text-neutral-500 hover:text-neutral-800"
          )}
        >
          <Sparkles className="size-3 text-amber-500 animate-pulse" />
          S3 Directo (Firma)
        </button>
      </div>

      {/* Input de tipo file oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={loading}
      />

      {/* Zona de Drop o Vista previa */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
          className={cn(
            "relative group flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 min-h-48",
            isDragOver 
              ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/5" 
              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/20"
          )}
        >
          <div className="flex flex-col items-center gap-3 transition-transform group-hover:scale-105 duration-300">
            <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-500 group-hover:text-primary group-hover:bg-primary/10 transition-colors duration-300">
              <UploadCloud className="size-8" />
            </div>
            <div>
              <p className="text-sm font-medium">Arrastra tu imagen aquí o haz clic</p>
              <p className="text-xs text-neutral-400 mt-1">Soporta PNG, JPEG, WEBP de hasta 5MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-950/40 p-3 flex flex-col gap-3 min-h-48 justify-center">
          <div className="relative aspect-video w-full max-h-36 rounded-md overflow-hidden bg-white dark:bg-neutral-900 border flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Vista previa de carga"
              className="object-contain h-full w-full"
            />
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileImage className="size-4 shrink-0 text-primary" />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate max-w-[200px]">
                  {file?.name}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={loading}
              onClick={resetUpload}
              className="size-8 text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {previewUrl && (
        <div className="flex items-center gap-2 mt-1">
          <Button
            type="button"
            variant="outline"
            onClick={resetUpload}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/95 text-primary-foreground hover:brightness-105"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              "Subir a S3"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
