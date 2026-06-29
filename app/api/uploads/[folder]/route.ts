import { NextResponse } from "next/server";
import { getSession } from "@/auth";
import { deleteTenantFileFromS3, uploadTenantFileToS3 } from "@/lib/s3";

// Lista blanca de carpetas permitidas en el sistema
const ALLOWED_FOLDERS = ["logos", "imagenes", "perfiles", "ventas", "documentos", "notas", "consultas", "pacientes"];

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

    if (folder !== "consultas" && folder !== "pacientes") {
      return NextResponse.json({ error: "Esta carga de archivos solo está disponible para consultas y pacientes" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo no proporcionado" }, { status: 400 });
    }

    const uploaded = await uploadTenantFileToS3({
      tenantFolder: session.TenantSlug || session.TenantNombre || session.TenantId,
      file,
      folder: folder as "consultas" | "pacientes",
    });

    return NextResponse.json({
      success: true,
      key: uploaded.key,
      nombre: uploaded.originalName,
      url: `/api/media/${uploaded.key}`,
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
    await deleteTenantFileFromS3(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en el endpoint de eliminación S3:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar la eliminación" },
      { status: 500 }
    );
  }
}
