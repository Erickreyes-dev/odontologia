import { NextResponse } from "next/server";
import { getSession } from "@/auth";
import { uploadImageToS3, createPresignedPutUrl, deleteImageFromS3 } from "@/lib/s3-storage";

// Lista blanca de carpetas permitidas en el sistema
const ALLOWED_FOLDERS = ["logos", "imagenes", "perfiles", "ventas", "documentos", "notas"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ folder: string }> }
) {
  try {
    // 1. Validar autenticación
    const session = await getSession();
    if (!session || !session.TenantSlug) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { folder } = await params;

    // 2. Validar que la carpeta de destino esté permitida
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: "Carpeta de destino no válida" }, { status: 400 });
    }

    // Estructurar la ruta en S3 para aislar los archivos por Tenant (clínica)
    // tenants/slug-de-clinica/carpeta-destino
    const folderPrefix = `tenants/${session.TenantSlug}/${folder}`;

    const url = new URL(request.url);
    const usePresign = url.searchParams.get("presign") === "true";

    // Opción A: Generar URL Firmada para que el cliente suba directo a S3
    if (usePresign) {
      const payload = await request.json().catch(() => ({}));
      const { filename, contentType } = payload;

      if (!filename || !contentType) {
        return NextResponse.json(
          { error: "Se requieren 'filename' y 'contentType' para generar la URL firmada." },
          { status: 400 }
        );
      }

      const presigned = await createPresignedPutUrl(filename, folderPrefix, contentType);
      return NextResponse.json({
        success: true,
        ...presigned,
      });
    }

    // Opción B: Subir mediante el Servidor de Next.js
    const formData = await request.formData();
    const file = formData.get("file");
    
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo no proporcionado" }, { status: 400 });
    }

    const uploaded = await uploadImageToS3(file, folderPrefix);
    
    // URL pública aproximada (asume permisos de lectura correspondientes o lectura directa con ACL)
    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${uploaded.key}`;

    return NextResponse.json({
      success: true,
      key: uploaded.key,
      nombre: uploaded.originalName,
      url: publicUrl
    });
  } catch (error) {
    console.error("Error en el endpoint de subida S3:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar la subida" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ folder: string }> }
) {
  try {
    // 1. Validar autenticación
    const session = await getSession();
    if (!session || !session.TenantSlug) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { folder } = await params;

    // 2. Validar que la carpeta de origen/destino esté permitida
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: "Carpeta no válida" }, { status: 400 });
    }

    const payload = await request.json().catch(() => ({}));
    const { key } = payload;

    if (!key) {
      return NextResponse.json({ error: "Se requiere la clave (key) del archivo a eliminar" }, { status: 400 });
    }

    // 3. Validar que la clave (key) pertenezca al tenant actual y a la carpeta especificada
    const expectedPrefix = `tenants/${session.TenantSlug}/${folder}/`;
    if (!key.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "No autorizado para eliminar este archivo" }, { status: 403 });
    }

    // 4. Eliminar el archivo de S3
    await deleteImageFromS3(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en el endpoint de eliminación S3:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar la eliminación" },
      { status: 500 }
    );
  }
}
