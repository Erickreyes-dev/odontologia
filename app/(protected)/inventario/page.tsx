import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Boxes } from "lucide-react";
import { DataTable } from "./components/data-table";
import { getSessionPermisos } from "@/auth";
import { getInventarioHistorial, getProductos } from "./actions";
import { columns } from "./components/columns";
import InventarioListMobile from "./components/inventario-list-mobile";
import InventarioHistorial from "./components/inventario-historial";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_inventario")) {
    return <NoAcceso />;
  }

  const params = await searchParams;
  const desde = params?.desde ? new Date(`${params.desde}T00:00:00`) : undefined;
  const hasta = params?.hasta ? new Date(`${params.hasta}T23:59:59`) : undefined;

  const [productos, historial] = await Promise.all([
    getProductos(),
    getInventarioHistorial(desde, hasta),
  ]);

  return (
    <div className="container mx-auto py-4">
      <HeaderComponent
        Icon={Boxes}
        screenName="Inventario"
        description="Listado de productos en inventario"
      />


      <form className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <Input type="date" name="desde" defaultValue={params?.desde ?? ""} />
        <Input type="date" name="hasta" defaultValue={params?.hasta ?? ""} />
        <Button type="submit" variant="outline">Filtrar historial</Button>
      </form>

      <InventarioHistorial data={historial} />

      <div className="hidden md:block">
        <DataTable columns={columns} data={productos} />
      </div>
      <div className="block md:hidden">
        <InventarioListMobile productos={productos} />
      </div>
    </div>
  );
}
