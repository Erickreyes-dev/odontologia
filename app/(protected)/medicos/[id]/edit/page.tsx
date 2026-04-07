import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getMedicoById } from "../../actions";
import { getEmpleados } from "@/app/(protected)/empleados/actions";
import { getProfesionesActivas } from "@/app/(protected)/profesiones/actions";
import { MedicoFormulario } from "../../components/Form";
import dynamic from "next/dynamic";
import { requireActiveSubscription } from "@/lib/require-active-subscription";


export default async function EditMedico({
 params }: { params: { id: string } }) {
  void dynamic;
  await requireActiveSubscription();
  // Verificar permisos
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("editar_medicos")) {
    return <NoAcceso />;
  }

  // Obtener el médico por ID
  const medico = await getMedicoById(params.id);
  if (!medico) {
    redirect("/medicos"); // Redirige si no existe
  }

  const empleados = await getEmpleados();
  const profesiones = await getProfesionesActivas();
  // Inicializamos solo los campos que usará el formulario
  const initialData = {
    id: medico.id,
    idEmpleado: medico.idEmpleado,
    profesionId: medico.profesionId,
    activo: medico.activo,
  };
  console.log("🚀 ~ EditMedico ~ initialData:", initialData)

  return (
    <div>
      <HeaderComponent
        Icon={Pencil}
        description="En este apartado podrá editar un médico."
        screenName="Editar Médico"
      />
      <MedicoFormulario
        isUpdate={true}
        empleados={empleados}
        initialData={initialData}
        profesiones={profesiones}
      />
    </div>
  );
}
