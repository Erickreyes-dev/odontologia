import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { getEmpleadosSinUsuario } from "../../empleados/actions";
import { getRolesPermisosActivos } from "../../roles/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Formulario } from "../components/Form";
import { getUserQuotaStatus } from "../actions";

export default async function Create() {




  const permisos = await getSessionPermisos();
  if (!permisos?.includes("crear_usuario")) {
    return <NoAcceso />;
  }

  const initialData = {
    usuario: "",
    contrasena: "",
    empleado_id: "",
    rol_id: "",
    activo: true,
  };
  const empleados = await getEmpleadosSinUsuario();
  const roles = await getRolesPermisosActivos();
  const quota = await getUserQuotaStatus();

  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrás crear un nuevo usuario"
        screenName="Usuarios"
      />
      {quota ? (
        <Card className="mb-4 border-cyan-200 bg-cyan-50/40 dark:border-cyan-900 dark:bg-cyan-950/20">
          <CardContent className="py-3 text-sm">
            Usuarios activos: {quota.usuariosActivos}/{quota.maxUsuarios} · Disponibles: {quota.disponibles}
          </CardContent>
        </Card>
      ) : null}
      {quota?.limiteAlcanzado ? (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="py-4 text-sm">
            Alcanzaste el límite de usuarios activos de tu paquete. Actualiza el paquete o desactiva un usuario para continuar.
          </CardContent>
        </Card>
      ) : (
        <Formulario isUpdate={false} initialData={initialData} empleados={empleados} roles={roles} />
      )}
    </div>
  );
}
