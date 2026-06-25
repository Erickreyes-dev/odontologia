import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ClipboardPlus, Save } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getExpedienteClinicoByPaciente, getPacienteById, saveExpedienteClinicoPaciente } from "../../actions";

function YesNoSelect({ name, label, value }: { name: string; label: string; value?: boolean | null }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={value === true ? "si" : value === false ? "no" : ""}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">No especificado</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}

function TextField({ name, label, value, placeholder }: { name: string; label: string; value?: string | null; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={value ?? ""} placeholder={placeholder} />
    </div>
  );
}

function TextAreaField({ name, label, value, placeholder }: { name: string; label: string; value?: string | null; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={value ?? ""} placeholder={placeholder} rows={4} />
    </div>
  );
}

export default async function ExpedienteClinicoPage({ params }: { params: { id: string } }) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pacientes")) {
    return <NoAcceso />;
  }

  const [paciente, expediente] = await Promise.all([
    getPacienteById(params.id),
    getExpedienteClinicoByPaciente(params.id),
  ]);

  if (!paciente) redirect("/pacientes");

  async function saveAction(formData: FormData) {
    "use server";
    await saveExpedienteClinicoPaciente(params.id, formData);
    redirect(`/pacientes/${params.id}/perfil`);
  }

  return (
    <div className="container mx-auto space-y-6 py-2">
      <HeaderComponent
        Icon={ClipboardPlus}
        description="Registro opcional de historia clínica, antecedentes y examen clínico del paciente."
        screenName="Expediente Clínico"
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Paciente</p>
          <h2 className="text-2xl font-bold">{paciente.nombre} {paciente.apellido}</h2>
        </div>
        <Link href={`/pacientes/${params.id}/perfil`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>
        </Link>
      </div>

      <form action={saveAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Enfermedad actual</CardTitle>
            <CardDescription>Todos los campos son opcionales.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <TextAreaField name="tiempoEnfermedad" label="Tiempo de enfermedad" value={expediente?.tiempoEnfermedad} />
            <TextAreaField name="signosSintomasPrincipales" label="Signos y síntomas principales" value={expediente?.signosSintomasPrincipales} />
            <TextAreaField name="relatoCronologico" label="Relato cronológico" value={expediente?.relatoCronologico} />
            <TextAreaField name="funcionesBiologicas" label="Funciones biológicas" value={expediente?.funcionesBiologicas} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Antecedentes</CardTitle>
            <CardDescription>Antecedentes familiares, personales y condiciones médicas relevantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <TextAreaField name="antecedentesFamiliares" label="Antecedentes familiares" value={expediente?.antecedentesFamiliares} />
              <TextAreaField name="antecedentesPersonales" label="Antecedentes personales" value={expediente?.antecedentesPersonales} />
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              <YesNoSelect name="presionAlta" label="¿Tiene o ha tenido presión alta?" value={expediente?.presionAlta} />
              <YesNoSelect name="presionBaja" label="¿Presión baja?" value={expediente?.presionBaja} />
              <YesNoSelect name="hepatitis" label="¿Hepatitis?" value={expediente?.hepatitis} />
              <YesNoSelect name="gastritis" label="¿Gastritis?" value={expediente?.gastritis} />
              <YesNoSelect name="vih" label="¿VIH?" value={expediente?.vih} />
              <YesNoSelect name="diabetes" label="¿Diabetes?" value={expediente?.diabetes} />
              <YesNoSelect name="asma" label="¿Asma?" value={expediente?.asma} />
              <YesNoSelect name="fuma" label="¿Fuma?" value={expediente?.fuma} />
            </div>
            <TextAreaField name="comentarioAdicional" label="Comentario adicional" value={expediente?.comentarioAdicional} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuestionario odontológico y médico</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <YesNoSelect name="enfermedadesSanguineas" label="¿Enfermedades sanguíneas?" value={expediente?.enfermedadesSanguineas} />
            <TextAreaField name="enfermedadesSanguineasCuales" label="¿Cuáles enfermedades sanguíneas?" value={expediente?.enfermedadesSanguineasCuales} />
            <YesNoSelect name="problemasCardiacos" label="¿Problemas cardíacos?" value={expediente?.problemasCardiacos} />
            <TextAreaField name="problemasCardiacosCuales" label="¿Cuáles problemas cardíacos?" value={expediente?.problemasCardiacosCuales} />
            <TextAreaField name="otraEnfermedad" label="¿Padece de alguna otra enfermedad?" value={expediente?.otraEnfermedad} />
            <TextField name="cepilladoDentalFrecuencia" label="¿Cuántas veces al día se cepilla los dientes?" value={expediente?.cepilladoDentalFrecuencia} />
            <YesNoSelect name="sangranEncias" label="¿Le sangran sus encías?" value={expediente?.sangranEncias} />
            <YesNoSelect name="hemorragiasExtraccion" label="¿Hemorragias anormales después de una extracción?" value={expediente?.hemorragiasExtraccion} />
            <YesNoSelect name="bruxismo" label="¿Hace rechinar o aprieta los dientes?" value={expediente?.bruxismo} />
            <TextAreaField name="otraMolestiaBoca" label="Otra molestia en la boca" value={expediente?.otraMolestiaBoca} />
            <TextAreaField name="alergias" label="Alergias" value={expediente?.alergias} />
            <TextAreaField name="operacionGrandeReciente" label="¿Alguna operación grande en los últimos años?" value={expediente?.operacionGrandeReciente} />
            <TextAreaField name="medicacionPermanente" label="¿Toma medicación de manera permanente?" value={expediente?.medicacionPermanente} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Examen clínico</CardTitle>
            <CardDescription>Signos vitales y evaluación clínica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <TextField name="presionArterial" label="PA (mmHg)" value={expediente?.presionArterial} placeholder="120/80" />
              <TextField name="frecuenciaCardiaca" label="FC (bpm)" value={expediente?.frecuenciaCardiaca} placeholder="75" />
              <TextField name="temperatura" label="Temperatura (°C)" value={expediente?.temperatura} placeholder="36.5" />
              <TextField name="frecuenciaRespiratoria" label="FR (r/m)" value={expediente?.frecuenciaRespiratoria} placeholder="16" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextAreaField name="examenExtraoral" label="Examen extraoral" value={expediente?.examenExtraoral} />
              <TextAreaField name="examenIntraoral" label="Examen intraoral" value={expediente?.examenIntraoral} />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button type="submit" size="lg" className="shadow-lg">
            <Save className="mr-2 h-4 w-4" />
            Guardar expediente clínico
          </Button>
        </div>
      </form>
    </div>
  );
}
