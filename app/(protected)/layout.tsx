import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppIntroTour } from "@/components/tour/app-intro-tour";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BadgeCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getQuickActionCatalogs } from "./quick-actions/actions";
import { QuickActionsPopover } from "@/components/quick-actions-popover";
import { prisma } from "@/lib/prisma";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const sesion = await getSession();

  if (!sesion) {
    redirect("/");
  }

  const quickData = await getQuickActionCatalogs();
  const tenantPlan = sesion.TenantId
    ? await prisma.tenant.findUnique({
      where: { id: sesion.TenantId },
      select: { paquete: { select: { nombre: true } } },
    })
    : null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full p-2" data-tour="main-content">
        <div className="mb-2 flex items-center justify-between">
          <SidebarTrigger data-tour="sidebar-trigger" />
          <div className="flex items-center gap-2">
            <div className="hidden rounded-xl border bg-card px-3 py-1.5 text-xs sm:flex sm:items-center sm:gap-2">
              <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-muted-foreground">Paquete actual:</span>
              <span className="font-semibold text-foreground">{tenantPlan?.paquete?.nombre ?? "Sin paquete"}</span>
            </div>
            {quickData ? <QuickActionsPopover data={quickData} /> : null}
          </div>
        </div>
        <AppIntroTour />
        {children}
      </main>
    </SidebarProvider>
  );
}
