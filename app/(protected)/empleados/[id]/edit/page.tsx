
import { getPuestosActivas } from "@/app/(protected)/puestos/actions";
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getEmpleadoById } from "../../actions";
import { EmpleadoFormulario } from "../../components/Form";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";

export default async function Edit({
 params }: { params: { id: string } }) {
  void dynamic;
  await requireActiveSubscription();
  // Verificar si hay una sesión activa

  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_empleado")) {
    return <NoAcceso />;
  }
  const puestos = await getPuestosActivas()


  // Obtener el cliente por getEmpleadoById ID
  const empleado = await getEmpleadoById(params.id);
  if (!empleado) {
    redirect("/empleados"); // Redirige si no se encuentra el cliente
  }
  const initialData = {
    id: empleado.id || "",
    identidad: empleado.identidad,
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    correo: empleado.correo,
    genero: empleado.genero, // Valor por defecto
    activo: empleado.activo ?? false,
    fechaNacimiento: new Date(empleado.fechaNacimiento),
    puesto_id: empleado.puesto_id || "",
    fechaIngreso: empleado.fechaIngreso ? new Date(empleado.fechaIngreso) : new Date(),
    telefono: empleado.telefono || "",
    vacaciones: empleado.vacaciones || 0
  };

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un empleado"
        screenName="Editar Empleado"
      />
      <EmpleadoFormulario
        puestos={puestos || []}
        isUpdate={true} // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData} // Datos iniciales para crear un nuevo empleado
      />

    </div>
  );
}
