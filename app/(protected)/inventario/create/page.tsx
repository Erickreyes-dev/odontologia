import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Boxes } from "lucide-react";
import { FormularioProducto } from "../components/form";

export default async function CreateProductoPage() {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("crear_inventario")) {
    return <NoAcceso />;
  }

  return (
    <div className="container mx-auto py-4">
      <HeaderComponent
        Icon={Boxes}
        description="Aquí puede crear un nuevo producto"
        screenName="Crear Producto"
      />
      <FormularioProducto isUpdate={false} />
    </div>
  );
}
