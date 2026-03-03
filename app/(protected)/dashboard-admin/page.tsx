import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ShieldCheck } from "lucide-react";
import { getAdminDashboardData } from "./actions";
import CreateTenantForm from "./components/create-tenant-form";

export default async function DashboardAdminPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_dashboard_admin")) {
    return <NoAcceso />;
  }

  const { kpis, recentTenants } = await getAdminDashboardData();

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent
        Icon={ShieldCheck}
        screenName="Dashboard Admin"
        description="Panel exclusivo para administración SaaS de tenants y métricas globales."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card><CardHeader><CardTitle className="text-sm">Tenants totales</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{kpis.totalTenants}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Tenants activos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{kpis.activeTenants}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Tenants inactivos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{kpis.inactiveTenants}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Usuarios globales</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{kpis.totalUsers}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pacientes globales</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{kpis.totalPacientes}</CardContent></Card>
      </div>

      {permisos.includes("gestionar_tenants") && (
        <Card>
          <CardHeader>
            <CardTitle>Crear tenant y usuario administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              El administrador del tenant se crea sin empleado interno y con rol AdministradorTenant.
            </p>
            <CreateTenantForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 size={16} /> Últimos tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTenants.map((t) => (
              <div key={t.id} className="rounded border p-3 text-sm">
                <div className="font-medium">{t.nombre} <span className="text-muted-foreground">({t.slug})</span></div>
                <div className="text-muted-foreground">
                  Plan: {t.plan} · Máx usuarios: {t.maxUsuarios} · Estado: {t.activo ? "Activo" : "Inactivo"}
                </div>
                <div className="text-muted-foreground">
                  Contacto: {t.contactoNombre ?? "N/D"} · {t.contactoCorreo ?? "N/D"}
                </div>
                <div className="text-muted-foreground">
                  Usuarios: {t._count.usuarios} · Roles: {t._count.roles} · Pacientes: {t._count.pacientes}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
