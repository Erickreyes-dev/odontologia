import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getAdminDashboardData } from "./actions";
import CreatePlatformAdminForm from "./components/create-platform-admin-form";

export default async function DashboardAdminPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_dashboard_admin")) {
    return <NoAcceso />;
  }

  const { kpis } = await getAdminDashboardData();

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
            <CardTitle>Crear más administradores dueños del sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Estos usuarios se crean con rol OwnerPlatform para administrar todos los tenants.
            </p>
            <CreatePlatformAdminForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos de plataforma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Use los módulos dedicados para administrar el SaaS:</p>
          <ul className="list-disc pl-4 text-muted-foreground">
            <li><Link className="underline" href="/tenants">Módulo Tenants</Link> para crear y administrar clínicas.</li>
            <li><Link className="underline" href="/paquetes">Módulo Paquetes</Link> para definir los planes disponibles.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}