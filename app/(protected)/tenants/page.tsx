import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { getTenantsData } from "./actions";
import CreateTenantForm from "./components/create-tenant-form";
import TenantStatusToggle from "./components/tenant-status-toggle";
import TenantPlanEditor from "./components/tenant-plan-editor";
import TenantDeleteButton from "./components/tenant-delete-button";

export default async function TenantsPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_tenants")) {
    return <NoAcceso />;
  }

  const { paquetes, tenants, metrics } = await getTenantsData();

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent
        Icon={Building2}
        screenName="Tenants"
        description="Módulo exclusivo del dueño de plataforma para gestión de clínicas cliente."
      />

      {permisos.includes("gestionar_tenants") && (
        <Card>
          <CardHeader>
            <CardTitle>Crear tenant y usuario administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Seleccione paquete y período. El sistema calcula automáticamente el próximo pago.
            </p>
            <CreateTenantForm paquetes={paquetes.map((p) => ({ id: p.id, nombre: p.nombre, maxUsuarios: p.maxUsuarios }))} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ganancias por suscripciones</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded border p-3">
            <p className="text-muted-foreground">Ingresos cobrados</p>
            <p className="text-xl font-semibold">USD {metrics.ingresosTotales.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Facturas pagadas: {metrics.paidCount}</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-muted-foreground">Pendiente por cobrar</p>
            <p className="text-xl font-semibold">USD {metrics.ingresosPendientes.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Facturas pendientes: {metrics.pendingCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenants.map((t) => (
              <div key={t.id} className="rounded border p-3 text-sm">
                <div className="font-medium">{t.nombre} <span className="text-muted-foreground">({t.slug})</span></div>
                <div className="text-muted-foreground">
                  Paquete: {t.paquete?.nombre ?? "Sin paquete"} · Plan: {t.plan} · Período: {t.periodoPlan} · Máx usuarios: {t.maxUsuarios} · Estado: {t.activo ? "Activo" : "Inactivo"}
                </div>
                <div className="text-muted-foreground">
                  Próximo pago: {t.proximoPago ? new Date(t.proximoPago).toLocaleDateString("es-HN") : "No definido"}
                </div>
                <div className="text-muted-foreground">
                  Contacto: {t.contactoNombre ?? "N/D"} · {t.contactoCorreo ?? "N/D"} · {t.telefono ?? "Sin teléfono"}
                </div>
                <div className="text-muted-foreground">
                  Usuarios: {t._count.usuarios} · Roles: {t._count.roles} · Pacientes: {t._count.pacientes}
                </div>

                {permisos.includes("gestionar_tenants") && (
                  <>
                    <TenantPlanEditor
                      tenantId={t.id}
                      currentPaqueteId={t.paqueteId}
                      currentPeriodoPlan={t.periodoPlan}
                      paquetes={paquetes.map((p) => ({ id: p.id, nombre: p.nombre }))}
                    />
                    <div className="mt-2">
                      <TenantStatusToggle tenantId={t.id} activo={t.activo} />
                    </div>
                    <div className="mt-2">
                      <TenantDeleteButton tenantId={t.id} tenantName={t.nombre} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
