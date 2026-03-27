import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getTenantsData } from "./actions";
import CreateTenantForm from "./components/create-tenant-form";
import TenantDeleteButton from "./components/tenant-delete-button";
import TenantPlanEditor from "./components/tenant-plan-editor";
import TenantStatusToggle from "./components/tenant-status-toggle";
import { buildTenantLoginUrl } from "@/lib/tenant-url";

const longDateFormatter = new Intl.DateTimeFormat("es-HN", {
  dateStyle: "full",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("es-HN", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatLongDate(date?: Date | null): string {
  if (!date) return "No definido";
  return longDateFormatter.format(new Date(date));
}

function formatMonthYear(date?: Date | null): string {
  if (!date) return "Sin mes asignado";
  return monthYearFormatter.format(new Date(date));
}

function normalizePeriodo(periodo: string): string {
  const map: Record<string, string> = {
    mensual: "Mensual",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual",
  };

  return map[periodo] ?? periodo;
}

function resolveSubscriptionBadge(tenant: {
  trialEndsAt?: Date | null;
  fechaExpiracion?: Date | null;
  estado?: string | null;
  activo: boolean;
}) {
  const now = new Date();

  if (!tenant.activo) {
    return <Badge variant="destructive">Tenant inactivo</Badge>;
  }

  if (tenant.trialEndsAt && new Date(tenant.trialEndsAt) > now) {
    return <Badge className="bg-amber-500 hover:bg-amber-500/90">En trial</Badge>;
  }

  if (tenant.fechaExpiracion && new Date(tenant.fechaExpiracion) < now) {
    return <Badge variant="destructive">Suscripción vencida</Badge>;
  }

  if (tenant.estado === "vigente") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600/90">Suscripción vigente</Badge>;
  }

  return <Badge variant="secondary">Estado: {tenant.estado ?? "pendiente"}</Badge>;
}

export default async function TenantsPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_tenants")) {
    return <NoAcceso />;
  }

  const { paquetes, tenants, metrics } = await getTenantsData();
  const now = new Date();
  const activeTrials = tenants.filter((tenant) => tenant.trialEndsAt && new Date(tenant.trialEndsAt) > now).length;

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent
        Icon={Building2}
        screenName="Tenants"
        description="Módulo root para gestionar clínicas cliente, revisar estado comercial y entrar rápido a cada tenant."
      />

      {permisos.includes("gestionar_tenants") && (
        <Card>
          <CardHeader>
            <CardTitle>Crear tenant y usuario administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Seleccione paquete y período. El sistema calcula automáticamente trial, fecha de expiración y próximo pago.
            </p>
            <CreateTenantForm paquetes={paquetes.map((p) => ({ id: p.id, nombre: p.nombre, maxUsuarios: p.maxUsuarios }))} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="size-4" /> Tenants visibles</p>
            <p className="text-2xl font-bold">{tenants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Clock3 className="size-4" /> Tenants en trial</p>
            <p className="text-2xl font-bold">{activeTrials}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><CircleDollarSign className="size-4" /> Ingresos cobrados</p>
            <p className="text-2xl font-bold">USD {metrics.ingresosTotales.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Facturas pagadas: {metrics.paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><CalendarClock className="size-4" /> Pendiente por cobrar</p>
            <p className="text-2xl font-bold">USD {metrics.ingresosPendientes.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Facturas pendientes: {metrics.pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.map((t) => {
              const isTrial = t.trialEndsAt && new Date(t.trialEndsAt) > now;
              const accessUrl = buildTenantLoginUrl(t.slug);

              return (
                <div key={t.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-base">{t.nombre}</div>
                      <div className="text-sm text-muted-foreground">/{t.slug}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {resolveSubscriptionBadge(t)}
                      <Button asChild size="sm" variant="outline">
                        <Link href={accessUrl} target="_blank" rel="noreferrer">
                          Entrar al tenant <ArrowUpRight className="ml-1 size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Paquete actual</p>
                      <p className="font-medium">{t.paquete?.nombre ?? "Sin paquete"}</p>
                      <p className="text-xs text-muted-foreground">Plan: {normalizePeriodo(t.periodoPlan)}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Mes de cobro</p>
                      <p className="font-medium capitalize">{formatMonthYear(t.proximoPago)}</p>
                      <p className="text-xs text-muted-foreground">Próximo pago: {formatLongDate(t.proximoPago)}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Trial y expiración</p>
                      <p className="font-medium">{isTrial ? "Sí, en período trial" : "No está en trial"}</p>
                      <p className="text-xs text-muted-foreground">Trial hasta: {formatLongDate(t.trialEndsAt)}</p>
                      <p className="text-xs text-muted-foreground">Expira: {formatLongDate(t.fechaExpiracion)}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Uso del tenant</p>
                      <p className="font-medium flex items-center gap-1"><Users className="size-4" /> {t._count.usuarios} / {t.maxUsuarios} usuarios</p>
                      <p className="text-xs text-muted-foreground">Roles: {t._count.roles} · Pacientes: {t._count.pacientes}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="size-4" /> Estado comercial: {t.estado}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" /> Creado: {formatLongDate(t.createAt)}</span>
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    Contacto: {t.contactoNombre ?? "N/D"} · {t.contactoCorreo ?? "N/D"} · {t.telefono ?? "Sin teléfono"}
                  </div>

                  {permisos.includes("gestionar_tenants") && (
                    <div className="mt-4 space-y-2">
                      <TenantPlanEditor
                        tenantId={t.id}
                        currentPaqueteId={t.paqueteId}
                        currentPeriodoPlan={t.periodoPlan}
                        paquetes={paquetes.map((p) => ({ id: p.id, nombre: p.nombre }))}
                      />
                      <TenantStatusToggle tenantId={t.id} activo={t.activo} />
                      <TenantDeleteButton tenantId={t.id} tenantName={t.nombre} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
