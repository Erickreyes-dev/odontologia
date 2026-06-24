/* eslint-disable @typescript-eslint/no-explicit-any */
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export type StoredImage = {
  ubicacion: string;
  nombre: string;
};

const DEFAULT_BUCKET = "crm-im-bucket-mysql";

function getBucketName() {
  return process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || DEFAULT_BUCKET;
}

function sanitizeFileName(name: string): string {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const safe = normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return safe || "imagen";
}

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

let s3Client: S3Client | undefined;

function getS3Client() {
  if (s3Client) return s3Client;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  
  const clientConfig: any = { region };
  
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;
  
  if (accessKeyId && secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    };
  }
  
  s3Client = new S3Client(clientConfig);
  return s3Client;
}

/**
 * Sube un archivo a S3 directamente desde el servidor convirtiéndolo a un Buffer.
 * Soporta archivos de hasta 1GB, pero se recomienda usar URLs firmadas para archivos grandes (>4MB).
 */
export async function uploadImageToS3(file: File, folder: string) {
  const sanitized = sanitizeFileName(file.name || "imagen");
  const extension = sanitized.includes(".") ? sanitized.split(".").pop() : "";
  const baseName = sanitized.includes(".") 
    ? sanitized.substring(0, sanitized.lastIndexOf(".")) 
    : sanitized;
  
  const key = `${folder}/${randomUUID()}-${baseName}${extension ? `.${extension}` : ""}`;
  const body = Buffer.from(await file.arrayBuffer());

  const client = getS3Client();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
        ContentLength: body.length,
      })
    );
  } catch (err: any) {
    const msg = err?.message || String(err);
    throw new Error(`No se pudo subir el archivo a S3. ${msg}`);
  }

  return { 
    key, 
    originalName: file.name,
    ubicacion: key,
    nombre: sanitized
  };
}

/**
 * Genera una URL firmada de tipo PUT para que el cliente (frontend) pueda subir
 * el archivo directamente a S3, ideal para mejorar rendimiento en archivos grandes de hasta 1GB.
 * Expira en 1 hora (3600 segundos) para permitir subidas lentas de archivos grandes.
 */
export async function createPresignedPutUrl(originalName: string, folder: string, contentType: string, expiresIn = 3600) {
  const sanitized = sanitizeFileName(originalName || "imagen");
  const extension = sanitized.includes(".") ? sanitized.split(".").pop() : "";
  const baseName = sanitized.includes(".") 
    ? sanitized.substring(0, sanitized.lastIndexOf(".")) 
    : sanitized;

  const key = `${folder}/${randomUUID()}-${baseName}${extension ? `.${extension}` : ""}`;
  
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return { url, key, name: sanitized, nombre: sanitized };
}

/**
 * Elimina un archivo de S3 a partir de su clave (Key).
 */
export async function deleteImageFromS3(key: string) {
  const client = getS3Client();
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      })
    );
  } catch (err: any) {
    const msg = err?.message || String(err);
    throw new Error(`No se pudo eliminar el archivo de S3. ${msg}`);
  }
}

/**
 * Genera una URL firmada de lectura para obtener un archivo de S3.
 */
export async function getImageFromS3(key: string) {
  const client = getS3Client();
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: getBucketName(), Key: key }), { expiresIn: 300 });
  return fetch(url);
}

export function getMediaUrl(ubicacion?: string | null) {
  return ubicacion ? `/api/media/${encodeKey(ubicacion)}` : "";
}

export function mediaUrl(key: string | null | undefined) {
  return key ? `/api/media/${key}` : null;
}

