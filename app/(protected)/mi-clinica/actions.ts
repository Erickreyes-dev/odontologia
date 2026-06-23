"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildTenantPublicUrl } from "@/lib/tenant-url";
import { revalidatePath } from "next/cache";

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
  logoBase64: string | null;
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
      logoBase64: true,
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
    tenantUrl: buildTenantPublicUrl(tenant.slug),
  };
}

export async function updateTenantClinicProfile(input: {
  telefono?: string | null;
  correo?: string | null;
  logoBase64?: string | null;
  mision?: string | null;
  vision?: string | null;
  horarios?: TenantClinicScheduleItem[] | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();

    if (!session?.TenantId || !session.Permiso?.includes("editar_tenant")) {
      return { success: false, error: "No tiene permisos para editar la información de la clínica" };
    }

    const telefonoRaw = input.telefono?.trim() ?? "";
    const correoRaw = input.correo?.trim().toLowerCase() ?? "";
    const logoBase64 = input.logoBase64?.trim() || null;
    const mision = input.mision?.trim() || null;
    const vision = input.vision?.trim() || null;
    const horariosJson = sanitizeSchedule(input.horarios);
    const facebookUrl = sanitizeOptionalUrl(input.facebookUrl, "Facebook");
    const twitterUrl = sanitizeOptionalUrl(input.twitterUrl, "Twitter / X");
    const instagramUrl = sanitizeOptionalUrl(input.instagramUrl, "Instagram");

    if (telefonoRaw.length > 20) {
      return { success: false, error: "El teléfono debe tener máximo 20 caracteres" };
    }

    if (correoRaw.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (correoRaw.length > 150 || !emailRegex.test(correoRaw)) {
        return { success: false, error: "Ingrese un correo válido con máximo 150 caracteres" };
      }
    }

    if (logoBase64 && logoBase64.length > 2_800_000) {
      return { success: false, error: "El logo es demasiado grande (máximo aproximado 2 MB)" };
    }

    await prisma.tenant.update({
      where: { id: session.TenantId },
      data: {
        telefono: telefonoRaw || null,
        contactoCorreo: correoRaw || null,
        logoBase64,
        mision,
        vision,
        horariosJson,
        facebookUrl,
        twitterUrl,
        instagramUrl,
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
