"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendTenantWhatsappMessage } from "@/lib/whatsapp/send-whatsapp";

export interface WhatsappChatPaciente {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

export interface WhatsappChatThread {
  phone: string;
  lastMessage: string;
  lastAt: string;
  direction: string;
}

export interface WhatsappChatMessage {
  id: string;
  phone: string;
  body: string;
  direction: string;
  createdAt: string;
}

export async function getWhatsappModuleData(): Promise<{
  enabled: boolean;
  estado: string;
  pacientes: WhatsappChatPaciente[];
  threads: WhatsappChatThread[];
  messages: WhatsappChatMessage[];
}> {
  const session = await getSession();
  if (!session?.TenantId) {
    return { enabled: false, estado: "desconectado", pacientes: [], threads: [], messages: [] };
  }

  const [config, pacientes, mensajes] = await Promise.all([
    prisma.tenantWhatsappConfig.findUnique({
      where: { tenantId: session.TenantId },
      select: { activo: true, estado: true },
    }),
    prisma.paciente.findMany({
      where: {
        tenantId: session.TenantId,
        activo: true,
        telefono: { not: null },
      },
      select: { id: true, nombre: true, apellido: true, telefono: true },
      orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
      take: 200,
    }),
    prisma.tenantWhatsappMensaje.findMany({
      where: { tenantId: session.TenantId },
      orderBy: { createAt: "desc" },
      take: 400,
    }),
  ]);

  const threadsMap = new Map<string, WhatsappChatThread>();

  for (const msg of mensajes) {
    const phone = (msg.direccion === "entrante" ? msg.fromPhone : msg.toPhone) ?? "";
    if (!phone || threadsMap.has(phone)) continue;

    threadsMap.set(phone, {
      phone,
      lastMessage: msg.cuerpo ?? "(sin texto)",
      lastAt: msg.createAt.toISOString(),
      direction: msg.direccion,
    });
  }

  return {
    enabled: Boolean(config?.activo) && config?.estado === "conectado",
    estado: config?.estado ?? "desconectado",
    pacientes: pacientes
      .filter((p) => Boolean(p.telefono))
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        telefono: p.telefono!,
      })),
    threads: Array.from(threadsMap.values()).slice(0, 50),
    messages: mensajes
      .map((msg) => ({
        id: msg.id,
        phone: (msg.direccion === "entrante" ? msg.fromPhone : msg.toPhone) ?? "",
        body: msg.cuerpo ?? "",
        direction: msg.direccion,
        createdAt: msg.createAt.toISOString(),
      }))
      .filter((msg) => Boolean(msg.phone))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  };
}

export async function sendWhatsappFromModule(input: {
  pacienteId?: string;
  telefono?: string;
  mensaje: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.TenantId) {
    return { success: false, error: "Sesión inválida" };
  }

  let telefonoDestino = input.telefono?.trim() || "";

  if (input.pacienteId) {
    const paciente = await prisma.paciente.findFirst({
      where: {
        id: input.pacienteId,
        tenantId: session.TenantId,
        activo: true,
      },
      select: { telefono: true },
    });

    telefonoDestino = paciente?.telefono?.trim() || telefonoDestino;
  }

  if (!telefonoDestino) {
    return { success: false, error: "Seleccione paciente o ingrese teléfono" };
  }

  const result = await sendTenantWhatsappMessage({
    tenantId: session.TenantId,
    toPhone: telefonoDestino,
    body: input.mensaje,
    tipoEvento: "manual_chat",
  });

  if (!result.success) {
    return result;
  }

  revalidatePath("/whatsapp");
  return { success: true };
}
