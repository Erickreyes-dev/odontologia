import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Tags } from "lucide-react";
import { getServicios } from "../../servicios/actions";
import { PromocionForm } from "../components/Form";

export default async function CreatePromocionPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("crear_promociones")) {
    return <NoAcceso />;
  }

  const servicios = await getServicios();

  return (
    <div className="space-y-4">
      <HeaderComponent Icon={Tags} screenName="Crear promoción" description="Defina un paquete promocional para consultas." />
      <PromocionForm
        isUpdate={false}
        servicios={servicios.map((s) => ({ id: s.id ?? "", nombre: s.nombre, precioBase: s.precioBase }))}
        initialData={{
          nombre: "",
          descripcion: "",
          precioReferencial: 0,
          precioPromocional: 0,
          fechaInicio: null,
          fechaFin: null,
          activo: true,
          mostrarEnLanding: false,
          servicios: [],
        }}
      />
    </div>
  );
}
