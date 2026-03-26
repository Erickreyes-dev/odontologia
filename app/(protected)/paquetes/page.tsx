import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box } from "lucide-react";
import { getPaquetes } from "./actions";
import CreatePaqueteForm from "./components/create-paquete-form";
import EditPaqueteForm from "./components/edit-paquete-form";
import PaqueteStatusToggle from "./components/paquete-status-toggle";
import SeedPaquetesButton from "./components/seed-paquetes-button";

export default async function PaquetesPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_paquetes")) {
    return <NoAcceso />;
  }

  const paquetes = await getPaquetes();

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent
        Icon={Box}
        screenName="Paquetes"
        description="Catálogo de planes comerciales para asignar al crear tenants."
      />

      {permisos.includes("gestionar_paquetes") && (
        <Card>
          <CardHeader>
            <CardTitle>Crear paquete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <SeedPaquetesButton />
            </div>
            <CreatePaqueteForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listado de paquetes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paquetes.map((p) => (
              <div key={p.id} className="rounded border p-3 text-sm">
                <div className="font-medium">{p.nombre}</div>
                <div className="text-muted-foreground">
                  USD mensual: {Number(p.precio).toFixed(2)} · Trimestral: {Number(p.precioTrimestral ?? 0).toFixed(2)} · Semestral: {Number(p.precioSemestral ?? 0).toFixed(2)} · Anual: {Number(p.precioAnual ?? 0).toFixed(2)}
                </div>
                <div className="text-muted-foreground">
                  Máx usuarios: {p.maxUsuarios} · Estado: {p.activo ? "Activo" : "Inactivo"}
                </div>
                <div className="text-muted-foreground">
                  Trial: {p.trialActivo ? `${p.trialDias} días` : "Sin trial"}
                </div>
                <div className="text-muted-foreground">{p.descripcion ?? "Sin descripción"}</div>
                {permisos.includes("gestionar_paquetes") && (
                  <>
                    <div className="mt-3 flex gap-2">
                      <PaqueteStatusToggle paqueteId={p.id} activo={p.activo} />
                      <EditPaqueteForm
                        paquete={{
                          id: p.id,
                          nombre: p.nombre,
                          descripcion: p.descripcion,
                          precio: Number(p.precio),
                          precioTrimestral: p.precioTrimestral ? Number(p.precioTrimestral) : null,
                          precioSemestral: p.precioSemestral ? Number(p.precioSemestral) : null,
                          precioAnual: p.precioAnual ? Number(p.precioAnual) : null,
                          maxUsuarios: p.maxUsuarios,
                          trialActivo: p.trialActivo,
                          trialDias: p.trialDias,
                        }}
                      />
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
