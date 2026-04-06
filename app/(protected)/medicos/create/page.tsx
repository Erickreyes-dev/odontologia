import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEmpleados } from "../../empleados/actions";
import { getProfesionesActivas } from "../../profesiones/actions";
import { MedicoFormulario } from "../components/Form";

export default async function CreateMedico() {
  const permisos = await getSessionPermisos();

  const session = await getSession();

  if (!session?.TenantId) {
    redirect("/login");
  }

  const [empleadosCount, profesionesCount] = await Promise.all([
    prisma.empleados.count({ where: { tenantId: session.TenantId } }),
    prisma.profesion.count({ where: { tenantId: session.TenantId } }),
  ]);

  if (empleadosCount === 0 || profesionesCount === 0) {
    redirect("/configuracion-inicial");
  }

  // Verifica permisos para crear médicos
  if (!permisos?.includes("crear_medicos")) {
    return <NoAcceso />;
  }

  const empleados = await getEmpleados();
  const profesiones = await getProfesionesActivas();
  // Inicializamos con valores vacíos para el formulario
  const initialData = {
    id: "",
    idEmpleado: "",
    profesionId: "",
    activo: true,
  };

  return (
    <div>
      <HeaderComponent
        Icon={UserPlus}
        description="En este apartado podrá crear un médico."
        screenName="Crear Médico"
      />
      <MedicoFormulario
        isUpdate={false}
        initialData={initialData}
        empleados={empleados}
        profesiones={profesiones}
      />
    </div>
  );
}
