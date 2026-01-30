
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getPacienteById } from "../../actions";
import { PacienteFormulario } from "../../components/Form";
import { getSegurosActivos } from "@/app/(protected)/seguros/actions";

export default async function EditSeguro({ params }: { params: { id: string } }) {
    // Verificar si hay una sesión activa

    const permisos = await getSessionPermisos();

    if (!permisos?.includes("editar_pacientes")) {
        return <NoAcceso />;
    }

    // Obtener el seguro por su ID
    const paciente = await getPacienteById(params.id);
    const seguros = await getSegurosActivos();

    if (!paciente) {
        redirect("/seguros"); // Redirige si no se encuentra el seguro
    }
   const pacienteEdit = {
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        activo: paciente.activo,
        identidad: paciente.identidad,
        fechaNacimiento: paciente.fechaNacimiento,
        genero: paciente.genero,
        telefono: paciente.telefono,
        correo: paciente.correo,
        direccion: paciente.direccion,
        seguroId: paciente.seguroId,
    }



    return (
        <div>
            <HeaderComponent
                Icon={Pencil}
                description="En este apartado podrá editar un seguro."
                screenName="Editar Seguro"
            />
            <PacienteFormulario
                isUpdate={true}
                initialData={pacienteEdit}
                seguros={seguros}
            />
        </div>
    );
}
