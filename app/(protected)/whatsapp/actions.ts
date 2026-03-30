"use server";

import { revalidatePath } from "next/cache";
import { requireTenantPermission } from "@/lib/authorization";
import { disconnectTenantWhatsAppConnection, getTenantWhatsAppConnection } from "@/lib/whatsapp/service";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant-query";
import { Prisma } from "@/lib/generated/prisma";

export async function getWhatsAppDashboardData() {
  await requireTenantPermission("ver_whatsapp");
  const connection = await getTenantWhatsAppConnection();

  const [sentCount, receivedCount, recentErrors] = await Promise.all([
    prisma.chatMessage.count({ where: await tenantWhere<Prisma.ChatMessageWhereInput>({ direction: "outbound" }) }),
    prisma.chatMessage.count({ where: await tenantWhere<Prisma.ChatMessageWhereInput>({ direction: "inbound" }) }),
    prisma.chatMessage.findMany({
      where: await tenantWhere<Prisma.ChatMessageWhereInput>({ providerStatus: "failed" }),
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, errorMessage: true, createdAt: true },
    }),
  ]);

  return {
    connection,
    sentCount,
    receivedCount,
    recentErrors,
  };
}

export async function disconnectWhatsApp(connectionId: string) {
  await requireTenantPermission("configurar_whatsapp");
  await disconnectTenantWhatsAppConnection(connectionId);
  revalidatePath("/whatsapp");
  return { success: true as const };
}
