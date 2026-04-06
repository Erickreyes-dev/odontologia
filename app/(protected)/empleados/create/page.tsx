import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPuestosActivas } from "../../puestos/actions";
import { EmpleadoFormulario } from "../components/Form"; // Asegúrate de que el formulario sea para Empleados

export default async function Create({
  searchParams,
}: {
  searchParams?: { fromSetup?: string };
}) {
  const permisos = await getSessionPermisos();
  const sesion = await getSession();

  // Redirige si no hay sesión
  if (!sesion) {
    redirect("/login");
  }
  if (!sesion.TenantId) {
    redirect("/configuracion-inicial");
  }

  // Verifica permisos para crear empleados
  if (!permisos?.includes("crear_empleados")) {
    return <NoAcceso />;
  }


  const puestosCount = await prisma.puesto.count({ where: { tenantId: sesion.TenantId } });
  if (puestosCount === 0) {
    redirect("/configuracion-inicial");
  }

  // Determina qué lista de puestos cargar según el rol del usuario
  const puestos = await getPuestosActivas()


  const initialData = {
    id: "",
    nombre: "",
    apellido: "",
    correo: "",
    genero: "Masculino", // Valor por defecto
    activo: true, // Por defecto, el nuevo empleado está activo
    fechaNacimiento: new Date(),
    nombreUsuario: "",
    jefe_id: "", // Por defecto, no tiene jefe asignado
    puesto_id: "", // Por defecto, no tiene puesto asignado
    identidad: "",
    fechaIngreso: new Date(), // Fecha de ingreso por defecto es hoy
    telefono: "",
    vacaciones: 0 // Por defecto, 0 días de vacaciones
  };


  return (
    <div>
      <HeaderComponent
        Icon={PlusCircle}
        description="En este apartado podrá crear un nuevo empleado."
        screenName="Crear Empleado" // Cambié la pantalla a "Crear Empleado"
      />
      <EmpleadoFormulario
        puestos={puestos || []}
        isUpdate={false} // Esto es para indicar que estamos creando, no actualizando
        initialData={initialData} // Datos iniciales para crear un nuevo empleado
        redirectAfterSave={searchParams?.fromSetup ? "/configuracion-inicial" : "/empleados"}
      />
    </div>
  );
}
