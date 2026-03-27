import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHelpGuide } from "@/components/tour/app-help-guide";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AlertTriangle, BadgeCheck, Timer } from "lucide-react";
import { redirect } from "next/navigation";
import { getQuickActionCatalogs } from "./quick-actions/actions";
import { QuickActionsPopover } from "@/components/quick-actions-popover";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { resolveSubscriptionStatus } from "@/lib/subscription-status";

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

  const pathname = headers().get("x-pathname");
  const subscriptionExemptPrefixes = ["/billing", "/suscripcion"];
  const requiresActiveSubscription = pathname
    ? !subscriptionExemptPrefixes.some((prefix) => pathname.startsWith(prefix))
    : false;

  const tenantPlan = sesion.TenantId
    ? await prisma.tenant.findUnique({
      where: { id: sesion.TenantId },
      select: {
        plan: true,
        estado: true,
        activo: true,
        trialEndsAt: true,
        fechaExpiracion: true,
        proximoPago: true,
        paquete: { select: { nombre: true } },
      },
    })
    : null;

  let effectiveStatus = "expirado";
  if (tenantPlan) {
    const calculatedStatus = resolveSubscriptionStatus({
      tenantActivo: tenantPlan.activo,
      trialEndsAt: tenantPlan.trialEndsAt,
      fechaExpiracion: tenantPlan.fechaExpiracion,
      proximoPago: tenantPlan.proximoPago,
    });
    effectiveStatus = tenantPlan.estado === "cancelado" || tenantPlan.estado === "expirado"
      ? tenantPlan.estado
      : calculatedStatus;

    if (tenantPlan.estado !== effectiveStatus) {
      await prisma.tenant.update({
        where: { id: sesion.TenantId },
        data: { estado: effectiveStatus },
      });
      tenantPlan.estado = effectiveStatus;
    }

    // Redirige a una página controlada de bloqueo para evitar ciclos de navegación.
    if (requiresActiveSubscription && effectiveStatus !== "vigente") {
      redirect(`/suscripcion?status=${effectiveStatus}`);
    }
  }

  const quickData = await getQuickActionCatalogs();
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
            {tenantPlan && effectiveStatus !== "vigente" ? (
              <div className="hidden rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 sm:flex sm:items-center sm:gap-2 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="font-semibold">Suscripción {effectiveStatus}</span>
              </div>
            ) : null}
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
