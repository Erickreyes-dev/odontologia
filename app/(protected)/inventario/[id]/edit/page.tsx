import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Boxes } from "lucide-react";
import { getProductoById } from "../../actions";
import { FormularioProducto } from "../../components/form";

interface Props {
  params: { id: string };
}

export default async function EditProductoPage({ params }: Props) {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_inventario")) {
    return <NoAcceso />;
  }

  const producto = await getProductoById(params.id);
  if (!producto) return <p>Producto no encontrado</p>;

  return (
    <div className="container mx-auto py-4">
      <HeaderComponent
        Icon={Boxes}
        description="Aquí puede editar un producto existente"
        screenName="Editar Producto"
      />
      <FormularioProducto isUpdate={true} initialData={producto} />
    </div>
  );
}
