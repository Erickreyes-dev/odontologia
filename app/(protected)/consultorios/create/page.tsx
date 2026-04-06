import { getSession, getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import {  ShieldPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConsultorioFormulario } from "../components/Form";

export default async function Create({
  searchParams,
}: {
  searchParams?: { fromSetup?: string };
}) {
  const permisos = await getSessionPermisos();

  const session = await getSession();

  if (!session?.TenantId) {
    redirect("/login");
  }

  const medicosCount = await prisma.medico.count({ where: { tenantId: session.TenantId } });
  if (medicosCount === 0) {
    redirect("/configuracion-inicial");
  }

  // Verifica permisos para crear puestos
  if (!permisos?.includes("crear_consultorios")) {
    return <NoAcceso />;
  }

  // Inicializamos con un valor específico para puesto
  const initialData = {
    nombre: "",
    ubicacion: "",
    id: "",
    activo: true,
  };

  return (
    <div>
      <HeaderComponent
        Icon={ShieldPlus}
        description="En este apartado podrá crear un consultorio."
        screenName="Crear consultorio"
      />
      <ConsultorioFormulario
        isUpdate={false}
        initialData={initialData}
        redirectAfterSave={searchParams?.fromSetup ? "/configuracion-inicial" : "/consultorios"}
      />
    </div>
  );
}
