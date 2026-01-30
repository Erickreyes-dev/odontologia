import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { UserPlus } from "lucide-react";
import { PacienteFormulario } from "../components/Form";
import { getSegurosActivos } from "../../seguros/actions";

export default async function Create() {
    const permisos = await getSessionPermisos();


    // Verifica permisos para crear puestos
    if (!permisos?.includes("crear_pacientes")) {
        return <NoAcceso />;
    }

    const seguros = await getSegurosActivos();

    // Inicializamos con un valor específico para puesto
    const initialData = {
        id: "",
        nombre: "",
        apellido: "",
        activo: true,
        identidad: "",
        fechaNacimiento: null,
        genero: "",
        telefono: "",
        correo: "",
        direccion: "",
        seguroId: "",
    }

    return (
        <div>
            <HeaderComponent
                Icon={UserPlus}
                description="En este apartado podrá crear un paciente."
                screenName="Crear Paciente"
            />
            <PacienteFormulario
                isUpdate={false}
                initialData={initialData}
                seguros={seguros}
            />
        </div>
    );
}
