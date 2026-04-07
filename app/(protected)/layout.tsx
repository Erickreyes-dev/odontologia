import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHelpGuide } from "@/components/tour/app-help-guide";
import { InitialSetupGuard } from "@/components/initial-setup-guard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AlertTriangle, BadgeCheck, Timer } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getQuickActionCatalogs } from "./quick-actions/actions";
import { QuickActionsPopover } from "@/components/quick-actions-popover";
import { prisma } from "@/lib/prisma";
import { resolveSubscriptionStatus } from "@/lib/subscription-status";
import { getServerTranslator } from "@/lib/i18n/settings";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";


type InitialSetupState = {
  puesto: boolean;
  empleado: boolean;
  profesion: boolean;
  medico: boolean;
  consultorio: boolean;
  paciente: boolean;
  servicio: boolean;
  cita: boolean;
  consulta: boolean;
};

function resolveInitialSetupState(counts: {
  puestos: number;
  empleados: number;
  profesiones: number;
  medicos: number;
  consultorios: number;
  pacientes: number;
  servicios: number;
  citas: number;
  consultas: number;
}): InitialSetupState {
  return {
    puesto: counts.puestos > 0,
    empleado: counts.empleados > 0,
    profesion: counts.profesiones > 0,
    medico: counts.medicos > 0,
    consultorio: counts.consultorios > 0,
    paciente: counts.pacientes > 0,
    servicio: counts.servicios > 0,
    cita: counts.citas > 0,
    consulta: counts.consultas > 0,
  };
}

function isInitialSetupCompleted(state: InitialSetupState): boolean {
  return Object.values(state).every(Boolean);
}

function calculateTrialDaysLeft(trialEndsAt?: Date | null): number {
  if (!trialEndsAt) return 0;
  const diffMs = trialEndsAt.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function resolvePathnameFromHeaders(nextHeaders: Headers): string {
  const raw = nextHeaders.get("x-pathname") ?? nextHeaders.get("next-url") ?? "";
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;

  try {
    return new URL(raw).pathname;
  } catch {
    return raw;
  }
}

function isSubscriptionExemptPath(pathname: string): boolean {
  const exemptPaths = ["/billing", "/suscripcion", "/dashboard-admin", "/tenants", "/paquetes"];
  return exemptPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const sesion = await getSession();
  const { t } = getServerTranslator();
  const nextHeaders = await headers();
  const pathname = resolvePathnameFromHeaders(nextHeaders);

  if (!sesion) {
    redirect("/");
  }


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
    effectiveStatus = resolveSubscriptionStatus({
      tenantActivo: tenantPlan.activo,
      trialEndsAt: tenantPlan.trialEndsAt,
      fechaExpiracion: tenantPlan.fechaExpiracion,
      proximoPago: tenantPlan.proximoPago,
    });

    if (tenantPlan.estado !== effectiveStatus) {
      await prisma.tenant.update({
        where: { id: sesion.TenantId },
        data: { estado: effectiveStatus },
      });
      tenantPlan.estado = effectiveStatus;
    }

  }

  if (tenantPlan && effectiveStatus !== "vigente" && pathname && !isSubscriptionExemptPath(pathname)) {
    redirect("/billing?subscription=required");
  }

  let isInitialSetupComplete = true;

  if (sesion.TenantId) {
    const [
      puestosCount,
      empleadosCount,
      profesionesCount,
      medicosCount,
      consultoriosCount,
      pacientesCount,
      serviciosCount,
      citasCount,
      consultasCount,
    ] = await Promise.all([
      prisma.puesto.count({ where: { tenantId: sesion.TenantId } }),
      prisma.empleados.count({ where: { tenantId: sesion.TenantId } }),
      prisma.profesion.count({ where: { tenantId: sesion.TenantId } }),
      prisma.medico.count({ where: { tenantId: sesion.TenantId } }),
      prisma.consultorio.count({ where: { tenantId: sesion.TenantId } }),
      prisma.paciente.count({ where: { tenantId: sesion.TenantId } }),
      prisma.servicio.count({ where: { tenantId: sesion.TenantId } }),
      prisma.cita.count({ where: { tenantId: sesion.TenantId } }),
      prisma.consulta.count({ where: { tenantId: sesion.TenantId } }),
    ]);

    const initialSetup = resolveInitialSetupState({
      puestos: puestosCount,
      empleados: empleadosCount,
      profesiones: profesionesCount,
      medicos: medicosCount,
      consultorios: consultoriosCount,
      pacientes: pacientesCount,
      servicios: serviciosCount,
      citas: citasCount,
      consultas: consultasCount,
    });

    isInitialSetupComplete = isInitialSetupCompleted(initialSetup);
  }

  const quickData = await getQuickActionCatalogs();
  const packageName = tenantPlan?.paquete?.nombre ?? tenantPlan?.plan ?? t("layout.noPackage");
  const trialDaysLeft = calculateTrialDaysLeft(tenantPlan?.trialEndsAt);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full overflow-x-hidden p-2" data-tour="main-content">
        <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger data-tour="sidebar-trigger" />
            <LanguageSwitcher />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {quickData ? <QuickActionsPopover data={quickData} /> : null}
            <div className="hidden rounded-xl border bg-card px-3 py-1.5 text-xs sm:flex sm:items-center sm:gap-2">
              <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
              <span className="text-muted-foreground">{t("layout.currentPackage")}</span>
              <span className="font-semibold text-foreground">{packageName}</span>
            </div>
            {tenantPlan && effectiveStatus !== "vigente" ? (
              <div className="hidden rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 sm:flex sm:items-center sm:gap-2 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="font-semibold">{t("layout.subscription")} {effectiveStatus}</span>
              </div>
            ) : null}
            {trialDaysLeft > 0 ? (
              <div className="hidden rounded-xl border bg-card px-3 py-1.5 text-xs sm:flex sm:items-center sm:gap-2">
                <Timer className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-muted-foreground">{t("layout.trialTime")}</span>
                <span className="font-semibold text-foreground">{`${trialDaysLeft} ${t("layout.remainingDays")}`}</span>
              </div>
            ) : null}
            <AppHelpGuide />
          </div>
        </div>
        <InitialSetupGuard isSetupCompleted={isInitialSetupComplete}>
          {children}
        </InitialSetupGuard>
      </main>
    </SidebarProvider>
  );
}
