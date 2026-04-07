// /pages/usuarios/[id]/editar/page.tsx
import { getEmpleadoById, getEmpleadosSinUsuario } from "@/app/(protected)/empleados/actions";

import { getRolesPermisosActivos } from "@/app/(protected)/roles/actions";
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getUsuarioById } from "../../actions";
import { Formulario } from "../../components/Form";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function Edit({
 params }: { params: { id: string } }) {
  void dynamic;
  await requireActiveSubscription();



  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_usuario")) {

    return <NoAcceso />;
  }

  const usuario = await getUsuarioById(params.id);
  const empleados = await getEmpleadosSinUsuario();
  const roles = await getRolesPermisosActivos();
  const empleadoAsignado = await getEmpleadoById(usuario?.empleado_id ?? "");


  if (!usuario) {
    redirect("/usuarios");
  }
  const initialData = {
    id: usuario.id,
    usuario: usuario.usuario ?? "",
    contrasena: "",
    empleado_id: usuario.empleado_id ?? "",
    rol_id: usuario.rol_id,
    activo: usuario.activo

  };

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrás editar un usuario"
        screenName="Editar Usuario"
      />
      <Formulario
        isUpdate={true}
        initialData={initialData}
        empleados={empleados}
        roles={roles}
        empleadoAsignado={empleadoAsignado}
      />
    </div>
  );
}
