import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { getTenantsData } from "./actions";
import CreateTenantForm from "./components/create-tenant-form";
import TenantStatusToggle from "./components/tenant-status-toggle";

export default async function TenantsPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_tenants")) {
    return <NoAcceso />;
  }

  const { paquetes, tenants } = await getTenantsData();

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
              Seleccione un paquete. El administrador se crea con rol AdministradorTenant.
            </p>
            <CreateTenantForm paquetes={paquetes.map((p) => ({ id: p.id, nombre: p.nombre, maxUsuarios: p.maxUsuarios }))} />
          </CardContent>
        </Card>
      )}

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
                  Paquete: {t.paquete?.nombre ?? "Sin paquete"} · Plan: {t.plan} · Máx usuarios: {t.maxUsuarios} · Estado: {t.activo ? "Activo" : "Inactivo"}
                </div>
                <div className="text-muted-foreground">
                  Contacto: {t.contactoNombre ?? "N/D"} · {t.contactoCorreo ?? "N/D"} · {t.telefono ?? "Sin teléfono"}
                </div>
                <div className="text-muted-foreground">
                  Usuarios: {t._count.usuarios} · Roles: {t._count.roles} · Pacientes: {t._count.pacientes}
                </div>
                {permisos.includes("gestionar_tenants") && <TenantStatusToggle tenantId={t.id} activo={t.activo} />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
