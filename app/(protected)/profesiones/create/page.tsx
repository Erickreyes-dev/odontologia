import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import {  ShieldPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfesionFormulario } from "../components/Form";

export default async function Create({
  searchParams,
}: {
  searchParams?: { fromSetup?: string };
}) {
  const permisos = await getSessionPermisos();

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }
  if (!session.TenantId) {
    redirect("/configuracion-inicial");
  }

  const empleadosCount = await prisma.empleados.count({ where: { tenantId: session.TenantId } });
  if (empleadosCount === 0) {
    redirect("/configuracion-inicial");
  }

  // Verifica permisos para crear profesiones
  if (!permisos?.includes("crear_profesiones")) {
    return <NoAcceso />;
  }

  // Inicializamos con un valor específico para puesto
  const initialData = {
    nombre: "",
    descripcion: "",
    id: "",
    activo: true,
  };

  return (
    <div>
      <HeaderComponent
        Icon={ShieldPlus}
        description="En este apartado podrá crear una profesión."
        screenName="Crear Profesión"
      />
      <ProfesionFormulario
        isUpdate={false}
        initialData={initialData}
        redirectAfterSave={searchParams?.fromSetup ? "/configuracion-inicial" : "/profesiones"}
      />
    </div>
  );
}
