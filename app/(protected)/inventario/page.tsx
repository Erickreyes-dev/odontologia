import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Boxes } from "lucide-react";
import { DataTable } from "./components/data-table";
import { getSessionPermisos } from "@/auth";
import { getProductos } from "./actions";
import { columns } from "./components/columns";

export default async function InventarioPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_inventario")) {
    return <NoAcceso />;
  }

  const productos = await getProductos();

  return (
    <div className="container mx-auto py-4">
      <HeaderComponent
        Icon={Boxes}
        screenName="Inventario"
        description="Listado de productos en inventario"
      />

      <DataTable columns={columns} data={productos} />
    </div>
  );
}
