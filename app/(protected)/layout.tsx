import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHelpGuide } from "@/components/tour/app-help-guide";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BadgeCheck, Timer } from "lucide-react";
import { redirect } from "next/navigation";
import { getQuickActionCatalogs } from "./quick-actions/actions";
import { QuickActionsPopover } from "@/components/quick-actions-popover";
import { prisma } from "@/lib/prisma";

function calculateTrialDaysLeft(trialEndsAt?: Date | null): number {
  if (!trialEndsAt) return 0;
  const diffMs = trialEndsAt.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const sesion = await getSession();

  if (!sesion) {
    redirect("/");
  }

  const quickData = await getQuickActionCatalogs();
  const tenantPlan = sesion.TenantId
    ? await prisma.tenant.findUnique({
      where: { id: sesion.TenantId },
      select: {
        plan: true,
        trialEndsAt: true,
        paquete: { select: { nombre: true } },
      },
    })
    : null;
  const packageName = tenantPlan?.paquete?.nombre ?? tenantPlan?.plan ?? "Sin paquete";
  const trialDaysLeft = calculateTrialDaysLeft(tenantPlan?.trialEndsAt);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full p-2" data-tour="main-content">
        <div className="mb-2 flex items-center justify-between">
          <SidebarTrigger data-tour="sidebar-trigger" />
          <div className="flex items-center gap-2">
            {quickData ? <QuickActionsPopover data={quickData} /> : null}
            <div className="hidden rounded-xl border bg-card px-3 py-1.5 text-xs sm:flex sm:items-center sm:gap-2">
              <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-muted-foreground">Paquete actual:</span>
              <span className="font-semibold text-foreground">{packageName}</span>
            </div>
            {trialDaysLeft > 0 ? (
              <div className="hidden rounded-xl border bg-card px-3 py-1.5 text-xs sm:flex sm:items-center sm:gap-2">
                <Timer className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-muted-foreground">Tiempo de prueba:</span>
                <span className="font-semibold text-foreground">{`${trialDaysLeft} día(s) restantes`}</span>
              </div>
            ) : null}
            <AppHelpGuide />
          </div>
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
