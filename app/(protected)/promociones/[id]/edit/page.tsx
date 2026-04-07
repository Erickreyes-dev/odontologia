import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { getServicios } from "../../../servicios/actions";
import { getPromocionById } from "../../actions";
import { PromocionForm } from "../../components/Form";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function EditPromocionPage({
 params }: { params: { id: string } }) {
  void dynamic;
  await requireActiveSubscription();
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("editar_promociones")) {
    return <NoAcceso />;
  }

  const [promocion, servicios] = await Promise.all([
    getPromocionById(params.id),
    getServicios(),
  ]);

  if (!promocion) {
    redirect("/promociones");
  }

  return (
    <div className="space-y-4">
      <HeaderComponent Icon={Pencil} screenName="Editar promoción" description="Actualice precios y servicios del paquete." />
      <PromocionForm
        isUpdate
        servicios={servicios.map((s) => ({ id: s.id ?? "", nombre: s.nombre, precioBase: s.precioBase }))}
        initialData={promocion}
      />
    </div>
  );
}
