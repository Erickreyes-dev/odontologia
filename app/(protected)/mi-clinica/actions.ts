"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface TenantClinicProfile {
  nombre: string;
  slug: string;
  logoBase64: string | null;
  contactoCorreo: string | null;
  telefono: string | null;
  mision: string | null;
  vision: string | null;
  serviciosInfo: string | null;
  horariosInfo: string | null;
  redesSociales: string | null;
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
      serviciosInfo: true,
      horariosInfo: true,
      redesSociales: true,
    },
  });

  return tenant;
}

export async function updateTenantClinicProfile(input: {
  telefono?: string | null;
  correo?: string | null;
  logoBase64?: string | null;
  mision?: string | null;
  vision?: string | null;
  serviciosInfo?: string | null;
  horariosInfo?: string | null;
  redesSociales?: string | null;
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
    const serviciosInfo = input.serviciosInfo?.trim() || null;
    const horariosInfo = input.horariosInfo?.trim() || null;
    const redesSociales = input.redesSociales?.trim() || null;

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
        serviciosInfo,
        horariosInfo,
        redesSociales,
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
