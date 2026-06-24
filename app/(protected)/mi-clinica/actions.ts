"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildTenantPublicUrl } from "@/lib/tenant-url";
import { revalidatePath } from "next/cache";
import { mediaUrl, uploadTenantImageToS3, deleteTenantImageFromS3 } from "@/lib/s3";

export type TenantClinicScheduleItem = {
  dia: string;
  cerrado: boolean;
  abre: string;
  cierra: string;
};

export interface TenantClinicProfile {
  nombre: string;
  slug: string;
  tenantUrl: string;
  logoUrl: string | null;
  landingImageUrl: string | null;
  contactoCorreo: string | null;
  telefono: string | null;
  mision: string | null;
  vision: string | null;
  horariosInfo: string | null;
  horariosJson: string | null;
  redesSociales: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
}

function sanitizeOptionalUrl(value: string | null | undefined, label: string) {
  const raw = value?.trim() ?? "";
  if (!raw) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Ingrese una URL válida para ${label}`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`La URL de ${label} debe iniciar con http:// o https://`);
  }

  if (raw.length > 255) {
    throw new Error(`La URL de ${label} debe tener máximo 255 caracteres`);
  }

  return raw;
}

function sanitizeSchedule(horarios: TenantClinicScheduleItem[] | null | undefined) {
  if (!horarios?.length) return null;

  const clean = horarios.map((item) => ({
    dia: item.dia.trim().slice(0, 30),
    cerrado: Boolean(item.cerrado),
    abre: item.cerrado ? "" : item.abre.trim().slice(0, 10),
    cierra: item.cerrado ? "" : item.cierra.trim().slice(0, 10),
  })).filter((item) => item.dia.length > 0);

  return clean.length ? JSON.stringify(clean) : null;
}

export async function getTenantClinicProfile(): Promise<TenantClinicProfile | null> {
  const session = await getSession();
  if (!session?.TenantId) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.TenantId },
    select: {
      nombre: true,
      slug: true,
      logoPath: true,
      landingImagePath: true,
      contactoCorreo: true,
      telefono: true,
      mision: true,
      vision: true,
      horariosInfo: true,
      horariosJson: true,
      redesSociales: true,
      facebookUrl: true,
      twitterUrl: true,
      instagramUrl: true,
    },
  });

  if (!tenant) return null;

  return {
    ...tenant,
    logoUrl: mediaUrl(tenant.logoPath),
    landingImageUrl: mediaUrl(tenant.landingImagePath),
    tenantUrl: buildTenantPublicUrl(tenant.slug),
  };
}

export async function updateTenantClinicProfile(
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();

    if (!session?.TenantId || !session.Permiso?.includes("editar_tenant")) {
      return { success: false, error: "No tiene permisos para editar la información de la clínica" };
    }

    const telefono = formData.get("telefono") as string | null;
    const correo = formData.get("correo") as string | null;
    const logoFile = formData.get("logoFile") as File | null;
    const landingImageFile = formData.get("landingImageFile") as File | null;
    const deleteLogo = formData.get("deleteLogo") === "true";
    const deleteLandingImage = formData.get("deleteLandingImage") === "true";
    const mision = formData.get("mision") as string | null;
    const vision = formData.get("vision") as string | null;
    const horariosRaw = formData.get("horarios") as string | null;
    const facebookUrl = formData.get("facebookUrl") as string | null;
    const twitterUrl = formData.get("twitterUrl") as string | null;
    const instagramUrl = formData.get("instagramUrl") as string | null;

    const telefonoRaw = telefono?.trim() ?? "";
    const correoRaw = correo?.trim().toLowerCase() ?? "";

    // Obtener la información actual del tenant para gestionar el borrado/reemplazo de imágenes
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: session.TenantId },
      select: { logoPath: true, landingImagePath: true },
    });

    let logoPath: string | null | undefined = undefined;
    if (logoFile?.size) {
      if (currentTenant?.logoPath) {
        try {
          await deleteTenantImageFromS3(currentTenant.logoPath);
        } catch (err) {
          console.error("Error al eliminar logo anterior de S3:", err);
        }
      }
      logoPath = await uploadTenantImageToS3({ tenantId: session.TenantId, file: logoFile, folder: "logos" });
    } else if (deleteLogo) {
      if (currentTenant?.logoPath) {
        try {
          await deleteTenantImageFromS3(currentTenant.logoPath);
        } catch (err) {
          console.error("Error al eliminar logo de S3:", err);
        }
      }
      logoPath = null;
    }

    let landingImagePath: string | null | undefined = undefined;
    if (landingImageFile?.size) {
      if (currentTenant?.landingImagePath) {
        try {
          await deleteTenantImageFromS3(currentTenant.landingImagePath);
        } catch (err) {
          console.error("Error al eliminar imagen de landing anterior de S3:", err);
        }
      }
      landingImagePath = await uploadTenantImageToS3({ tenantId: session.TenantId, file: landingImageFile, folder: "landing" });
    } else if (deleteLandingImage) {
      if (currentTenant?.landingImagePath) {
        try {
          await deleteTenantImageFromS3(currentTenant.landingImagePath);
        } catch (err) {
          console.error("Error al eliminar imagen de landing de S3:", err);
        }
      }
      landingImagePath = null;
    }

    const misionClean = mision?.trim() || null;
    const visionClean = vision?.trim() || null;

    let horarios: TenantClinicScheduleItem[] | null = null;
    if (horariosRaw) {
      try {
        horarios = JSON.parse(horariosRaw);
      } catch (e) {
        // ignore invalid JSON
      }
    }
    const horariosJson = sanitizeSchedule(horarios);
    const facebookUrlClean = sanitizeOptionalUrl(facebookUrl, "Facebook");
    const twitterUrlClean = sanitizeOptionalUrl(twitterUrl, "Twitter / X");
    const instagramUrlClean = sanitizeOptionalUrl(instagramUrl, "Instagram");

    if (telefonoRaw.length > 20) {
      return { success: false, error: "El teléfono debe tener máximo 20 caracteres" };
    }

    if (correoRaw.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (correoRaw.length > 150 || !emailRegex.test(correoRaw)) {
        return { success: false, error: "Ingrese un correo válido con máximo 150 caracteres" };
      }
    }

    await prisma.tenant.update({
      where: { id: session.TenantId },
      data: {
        telefono: telefonoRaw || null,
        contactoCorreo: correoRaw || null,
        ...(logoPath !== undefined ? { logoPath } : {}),
        ...(landingImagePath !== undefined ? { landingImagePath } : {}),
        mision: misionClean,
        vision: visionClean,
        horariosJson,
        facebookUrl: facebookUrlClean,
        twitterUrl: twitterUrlClean,
        instagramUrl: instagramUrlClean,
      },
    });

    revalidatePath("/mi-clinica");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo actualizar la información de la clínica",
    };
  }
}
