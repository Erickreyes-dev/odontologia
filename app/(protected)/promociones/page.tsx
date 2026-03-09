import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportExcelButton } from "@/components/export-excel-button";
import { Tags } from "lucide-react";
import Link from "next/link";
import { getPromociones } from "./actions";

export default async function PromocionesPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_promociones")) {
    return <NoAcceso />;
  }

  const promociones = await getPromociones();

  return (
    <div className="container mx-auto py-4 space-y-5">
      <HeaderComponent Icon={Tags} screenName="Promociones" description="Paquetes y promociones de servicios por clínica." />

      <div className="flex flex-col gap-2 sm:flex-row">
        {permisos.includes("crear_promociones") && (
          <Link href="/promociones/create">
            <Button>Crear promoción</Button>
          </Link>
        )}
        <ExportExcelButton data={promociones as unknown as Record<string, unknown>[]} fileName="promociones" />
      </div>

      <div className="space-y-3">
        {promociones.map((promo) => (
          <div key={promo.id} className="rounded border p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">{promo.nombre}</p>
              <Badge variant={promo.activo ? "default" : "secondary"}>{promo.activo ? "Activa" : "Inactiva"}</Badge>
            </div>
            <p className="text-muted-foreground">{promo.descripcion || "Sin descripción"}</p>
            <p className="mt-1">Normal: L {promo.precioReferencial.toFixed(2)} · Promo: L {promo.precioPromocional.toFixed(2)}</p>
            <p className="text-muted-foreground">Servicios: {promo.servicios.length}</p>
            {permisos.includes("editar_promociones") && promo.id && (
              <Link href={`/promociones/${promo.id}/edit`} className="inline-block mt-2 text-primary">Editar</Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
