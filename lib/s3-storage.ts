import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const bucketName = process.env.AWS_S3_BUCKET || "";
const region = process.env.AWS_REGION || "us-east-1";

// Inicialización del cliente de S3 de manera segura
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Normaliza y limpia un nombre de archivo para evitar problemas con caracteres especiales o espacios en S3.
 */
function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve diacríticos (acentos)
    .replace(/[^a-zA-Z0-9._-]/g, "-") // Reemplaza caracteres no permitidos por guiones
    .replace(/-+/g, "-"); // Colapsa múltiples guiones seguidos
}

/**
 * Sube un archivo a S3 directamente desde el servidor convirtiéndolo a un Buffer.
 * Estructura de la ruta: folder/uuid-nombre.ext
 */
export async function uploadImageToS3(file: File, folder: string) {
  const sanitized = sanitizeFileName(file.name || "imagen");
  const extension = sanitized.includes(".") ? sanitized.split(".").pop() : "";
  const baseName = sanitized.includes(".") 
    ? sanitized.substring(0, sanitized.lastIndexOf(".")) 
    : sanitized;
  
  const key = `${folder}/${randomUUID()}-${baseName}${extension ? `.${extension}` : ""}`;
  const body = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: file.type || "application/octet-stream",
    })
  );

  return { key, originalName: file.name };
}

/**
 * Genera una URL firmada de tipo PUT para que el cliente (frontend) pueda subir
 * el archivo directamente a S3, ideal para mejorar rendimiento en archivos grandes.
 * Expira en 15 minutos (900 segundos).
 */
export async function createPresignedPutUrl(originalName: string, folder: string, contentType: string) {
  const sanitized = sanitizeFileName(originalName || "imagen");
  const extension = sanitized.includes(".") ? sanitized.split(".").pop() : "";
  const baseName = sanitized.includes(".") 
    ? sanitized.substring(0, sanitized.lastIndexOf(".")) 
    : sanitized;

  const key = `${folder}/${randomUUID()}-${baseName}${extension ? `.${extension}` : ""}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  return { url, key, name: sanitized };
}

/**
 * Elimina una imagen de S3 a partir de su clave (Key).
 */
export async function deleteImageFromS3(key: string) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}
