import HeaderComponent from "@/components/HeaderComponent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant-query";
import { HeartPulse } from "lucide-react";
import {
  createAlergiaPacienteAction,
  createDiagnosticoAction,
  createHistoriaClinicaAction,
  createInterconsultaAction,
  createMedicamentoAction,
  createOrdenEstudioAction,
  createPrescripcionAction,
  createProgramaCronicoAction,
  createSignoVitalAction,
} from "./actions";
import { PrescripcionesPrintList } from "./components/prescripciones-print-list";
import { SectionCard } from "./components/SectionCard";

interface MedicinaGeneralPageProps {
  searchParams?: {
    pacienteId?: string;
    consultaId?: string;
  };
}

interface ContextoAtencionOption {
  value: string;
  label: string;
}

export default async function MedicinaGeneralPage({ searchParams }: MedicinaGeneralPageProps) {
  const selectedPacienteId = searchParams?.pacienteId ?? "";
  const selectedConsultaId = searchParams?.consultaId ?? "";

  const [pacientes, consultas, citasSinConsulta, historias, alergias, signos, diagnosticos, medicamentos, prescripciones, ordenes, interconsultas, programas, tenant] = await Promise.all([
    prisma.paciente.findMany({
      where: await tenantWhere({}),
      select: { id: true, nombre: true, apellido: true },
      take: 40,
      orderBy: { createAt: "desc" },
    }),
    prisma.consulta.findMany({
      where: await tenantWhere({}),
      select: {
        id: true,
        cita: {
          select: {
            fechaHora: true,
            paciente: { select: { nombre: true, apellido: true } },
          },
        },
      },
      take: 40,
      orderBy: { createAt: "desc" },
    }),
    prisma.cita.findMany({
      where: await tenantWhere({ consulta: { is: null } }),
      select: {
        id: true,
        fechaHora: true,
        paciente: { select: { nombre: true, apellido: true } },
      },
      take: 40,
      orderBy: { fechaHora: "desc" },
    }),
    prisma.historiaClinica.findMany({ where: await tenantWhere({}), include: { paciente: true }, take: 8, orderBy: { updateAt: "desc" } }),
    prisma.alergiaPaciente.findMany({ where: await tenantWhere({}), include: { paciente: true }, take: 8, orderBy: { createAt: "desc" } }),
    prisma.signoVital.findMany({ where: await tenantWhere({}), include: { consulta: true }, take: 8, orderBy: { fechaToma: "desc" } }),
    prisma.diagnosticoConsulta.findMany({ where: await tenantWhere({}), include: { consulta: true }, take: 8, orderBy: { createAt: "desc" } }),
    prisma.medicamentoCatalogo.findMany({ where: await tenantWhere({}), take: 8, orderBy: { createAt: "desc" } }),
    prisma.prescripcion.findMany({
      where: await tenantWhere({}),
      include: {
        consulta: {
          select: {
            cita: {
              select: {
                paciente: { select: { nombre: true, apellido: true } },
              },
            },
          },
        },
        items: {
          include: {
            medicamento: true,
          },
        },
      },
      take: 8,
      orderBy: { fechaEmision: "desc" },
    }),
    prisma.ordenEstudio.findMany({ where: await tenantWhere({}), take: 8, orderBy: { fechaSolicitud: "desc" } }),
    prisma.interconsulta.findMany({ where: await tenantWhere({}), take: 8, orderBy: { fechaReferencia: "desc" } }),
    prisma.programaCronicoPaciente.findMany({ where: await tenantWhere({}), include: { paciente: true }, take: 8, orderBy: { createAt: "desc" } }),
    prisma.tenant.findFirst({
      where: await tenantWhere({}),
      select: { nombre: true },
    }),
  ]);

  const pacienteSeleccionado = pacientes.find((p) => p.id === selectedPacienteId);
  const contextosAtencion: ContextoAtencionOption[] = [
    ...consultas.map((consulta) => ({
      value: consulta.id,
      label: `Consulta ${consulta.id.slice(0, 8)} · ${formatFechaCita(consulta.cita.fechaHora)} · ${consulta.cita.paciente.nombre} ${consulta.cita.paciente.apellido}`,
    })),
    ...citasSinConsulta.map((cita) => ({
      value: `cita::${cita.id}`,
      label: `Cita ${formatFechaCita(cita.fechaHora)} · ${cita.paciente.nombre} ${cita.paciente.apellido} (se crea consulta al guardar)`,
    })),
  ];
  const defaultAtencion = selectedConsultaId || contextosAtencion[0]?.value || "";
  const recetasParaImprimir = prescripciones.map((prescripcion) => ({
    id: prescripcion.id,
    fechaEmision: formatFechaCita(prescripcion.fechaEmision),
    pacienteNombre: `${prescripcion.consulta.cita.paciente.nombre} ${prescripcion.consulta.cita.paciente.apellido}`.trim(),
    consultaId: prescripcion.consultaId,
    indicacionesGenerales: prescripcion.indicacionesGenerales,
    items: prescripcion.items.map((item) => ({
      medicamento: item.medicamento?.principioActivo ?? item.descripcionLibre ?? "Medicamento no especificado",
      dosis: item.dosis,
      via: item.via,
      frecuencia: item.frecuencia,
      duracion: item.duracion,
      indicacion: item.indicacion,
    })),
  }));

  return (
    <div className="container mx-auto space-y-4 px-4 py-2 md:space-y-6 md:px-6">
      <HeaderComponent
        Icon={HeartPulse}
        screenName="Medicina General"
        description="Módulo dividido por flujo clínico: perfil longitudinal, atención de consulta y catálogo terapéutico."
      />

      {pacienteSeleccionado && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paciente en contexto</p>
              <p className="font-medium">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
            </div>
            <a href={`/pacientes/${pacienteSeleccionado.id}/perfil`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Ver perfil completo
            </a>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard title="Pacientes" value={pacientes.length} subtitle="Disponibles para registrar" />
        <MetricCard title="Consultas" value={consultas.length} subtitle="Contextos ya creados" />
        <MetricCard title="Citas sin consulta" value={citasSinConsulta.length} subtitle="Se convierten automáticamente" />
      </div>

      <ModuleIntro
        title="Módulo 1 · Perfil longitudinal del paciente"
        description="Aquí solo vive la información base del paciente: historia clínica, alergias y programas crónicos."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Historia clínica">
          <SectionIntro description="Resumen base para continuidad clínica." badge="Perfil" />
          <form action={createHistoriaClinicaAction} className="space-y-3">
            <Field label="Paciente">
              <select name="pacienteId" defaultValue={selectedPacienteId || pacientes[0]?.id} className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm" required>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </Field>
            <Field label="Enfermedad actual (HPI)"><Textarea name="hpi" placeholder="Motivo principal y evolución." /></Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Antecedentes personales"><Textarea name="antecedentesPersonales" placeholder="Patológicos, quirúrgicos, farmacológicos..." /></Field>
              <Field label="Antecedentes familiares"><Textarea name="antecedentesFamiliares" placeholder="Riesgo familiar relevante." /></Field>
            </div>
            <Field label="Hábitos"><Textarea name="habitos" placeholder="Sueño, alimentación, actividad, tabaco/alcohol..." /></Field>
            <Button type="submit" className="w-full md:w-auto">Guardar historia clínica</Button>
          </form>
          <RecentList items={historias.map((h) => `${h.paciente.nombre} ${h.paciente.apellido}`)} emptyMessage="Sin historias registradas aún." />
        </SectionCard>

        <SectionCard title="Alergias">
          <SectionIntro description="Control de alergias para seguridad del paciente." badge="Seguridad" />
          <form action={createAlergiaPacienteAction} className="space-y-3">
            <Field label="Paciente">
              <select name="pacienteId" defaultValue={selectedPacienteId || pacientes[0]?.id} className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm" required>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Alérgeno"><Input name="alergeno" placeholder="Ej: Penicilina" required /></Field>
              <Field label="Reacción"><Input name="reaccion" placeholder="Ej: Urticaria" /></Field>
            </div>
            <Field label="Severidad">
              <select name="severidad" className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm" defaultValue="LEVE">
                <option value="LEVE">Leve</option><option value="MODERADA">Moderada</option><option value="SEVERA">Severa</option>
              </select>
            </Field>
            <Button type="submit" className="w-full md:w-auto">Agregar alergia</Button>
          </form>
          <RecentList items={alergias.map((a) => `${a.alergeno} (${a.severidad})`)} emptyMessage="Sin alergias registradas aún." />
        </SectionCard>

        <SectionCard title="Programas crónicos" className="xl:col-span-2">
          <SectionIntro description="Seguimiento de metas en enfermedades crónicas." badge="Seguimiento" />
          <form action={createProgramaCronicoAction} className="space-y-3">
            <Field label="Paciente">
              <select name="pacienteId" defaultValue={selectedPacienteId || pacientes[0]?.id} className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm" required>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Tipo de programa">
                <select name="tipo" className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm" defaultValue="HTA">
                  <option value="HTA">HTA</option><option value="DM2">DM2</option><option value="DISLIPIDEMIA">Dislipidemia</option><option value="OBESIDAD">Obesidad</option><option value="ASMA_EPOC">Asma/EPOC</option><option value="OTRO">Otro</option>
                </select>
              </Field>
              <Field label="Nombre personalizado"><Input name="nombrePersonalizado" placeholder="Opcional" /></Field>
            </div>
            <Field label="Meta clínica"><Input name="metaClinica" placeholder="Ej: HbA1c < 7%" /></Field>
            <Field label="Observaciones"><Textarea name="observaciones" placeholder="Evolución, alertas y recomendaciones." /></Field>
            <Button type="submit" className="w-full md:w-auto">Agregar a programa</Button>
          </form>
          <RecentList items={programas.map((p) => `${p.paciente.nombre} ${p.paciente.apellido} - ${p.tipo}`)} emptyMessage="Sin pacientes en programas crónicos aún." />
        </SectionCard>
      </div>

      <ModuleIntro
        title="Módulo 2 · Atención de consulta actual"
        description="Estos formularios pertenecen a una consulta puntual. Si eliges una cita sin consulta, se crea automáticamente al guardar."
      />
      {contextosAtencion.length === 0 ? (
        <Alert>
          <AlertTitle>No hay consultas ni citas disponibles</AlertTitle>
          <AlertDescription>Primero crea una cita o abre la consulta desde el módulo de Citas para continuar con este bloque.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Signos vitales">
            <SectionIntro description="Registro de constantes y examen físico." badge="Consulta" />
            <form action={createSignoVitalAction} className="space-y-3">
              <ConsultaContextSelect options={contextosAtencion} defaultValue={defaultAtencion} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" name="tensionSistolica" placeholder="TA Sistólica" />
                <Input type="number" name="tensionDiastolica" placeholder="TA Diastólica" />
                <Input type="number" name="frecuenciaCardiaca" placeholder="FC" />
                <Input type="number" step="0.1" name="temperatura" placeholder="Temp" />
                <Input type="number" name="saturacionOxigeno" placeholder="SatO2" />
                <Input type="number" step="0.01" name="pesoKg" placeholder="Peso (kg)" />
                <Input type="number" step="0.01" name="tallaM" placeholder="Talla (m)" />
              </div>
              <Field label="Examen físico"><Textarea name="examenFisico" placeholder="Hallazgos clínicos relevantes." /></Field>
              <Button type="submit" className="w-full md:w-auto">Registrar signos vitales</Button>
            </form>
            <RecentList items={signos.map((s) => `${s.consultaId.slice(0, 8)} • TA ${s.tensionSistolica ?? "-"}/${s.tensionDiastolica ?? "-"}`)} emptyMessage="Sin signos vitales registrados aún." />
          </SectionCard>

          <SectionCard title="Diagnósticos CIE-10">
            <SectionIntro description="Diagnóstico principal y estado diagnóstico." badge="Consulta" />
            <form action={createDiagnosticoAction} className="space-y-3">
              <ConsultaContextSelect options={contextosAtencion} defaultValue={defaultAtencion} />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Código CIE-10"><Input name="codigo" placeholder="Ej: J02.9" /></Field>
                <Field label="Estado diagnóstico">
                  <select name="estado" className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm" defaultValue="SOSPECHA">
                    <option value="SOSPECHA">Sospecha</option><option value="CONFIRMADO">Confirmado</option><option value="DESCARTADO">Descartado</option>
                  </select>
                </Field>
              </div>
              <Field label="Descripción"><Input name="descripcion" placeholder="Descripción clínica" required /></Field>
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" name="principal" className="h-4 w-4 rounded border" /> Diagnóstico principal</label>
              <Button type="submit" className="w-full md:w-auto">Agregar diagnóstico</Button>
            </form>
            <RecentList items={diagnosticos.map((d) => `${d.codigo ?? "SN"} - ${d.descripcion}`)} emptyMessage="Sin diagnósticos registrados aún." />
          </SectionCard>

          <SectionCard title="Prescripciones">
            <SectionIntro description="Receta con dosis, vía y duración." badge="Consulta" />
            <form action={createPrescripcionAction} className="space-y-3">
              <ConsultaContextSelect options={contextosAtencion} defaultValue={defaultAtencion} />
              <Field label="Indicaciones generales"><Textarea name="indicacionesGenerales" placeholder="Recomendaciones generales de la receta." /></Field>
              <Field label="Medicamento (opcional)">
                <select name="medicamentoId" className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm">
                  <option value="">Seleccionar medicamento</option>
                  {medicamentos.map((m) => <option key={m.id} value={m.id}>{m.principioActivo}</option>)}
                </select>
              </Field>
              <Field label="Descripción libre"><Input name="descripcionLibre" placeholder="Texto alterno si no existe en catálogo" /></Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Dosis"><Input name="dosis" placeholder="1 tableta" required /></Field>
                <Field label="Vía"><Input name="via" placeholder="Oral" required /></Field>
                <Field label="Frecuencia"><Input name="frecuencia" placeholder="Cada 8 horas" required /></Field>
                <Field label="Duración"><Input name="duracion" placeholder="5 días" required /></Field>
              </div>
              <Field label="Indicación"><Input name="indicacion" placeholder="Para dolor y fiebre" /></Field>
              <Button type="submit" className="w-full md:w-auto">Crear receta</Button>
            </form>
            <PrescripcionesPrintList recetas={recetasParaImprimir} clinicName={tenant?.nombre ?? "Clínica"} />
          </SectionCard>

          <SectionCard title="Órdenes de estudio">
            <SectionIntro description="Solicitudes de laboratorio, imagen u otros." badge="Consulta" />
            <form action={createOrdenEstudioAction} className="space-y-3">
              <ConsultaContextSelect options={contextosAtencion} defaultValue={defaultAtencion} />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Tipo de estudio">
                  <select name="tipo" className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm" defaultValue="LABORATORIO">
                    <option value="LABORATORIO">Laboratorio</option><option value="IMAGEN">Imagen</option><option value="OTRO">Otro</option>
                  </select>
                </Field>
                <Field label="Nombre del estudio"><Input name="estudioNombre" placeholder="Ej: Hemograma completo" required /></Field>
              </div>
              <Field label="Indicación clínica"><Textarea name="indicacion" placeholder="Motivo clínico de la solicitud." /></Field>
              <Button type="submit" className="w-full md:w-auto">Solicitar estudio</Button>
            </form>
            <RecentList items={ordenes.map((o) => `${o.tipo}: ${o.estudioNombre} (${o.estado})`)} emptyMessage="Sin órdenes registradas aún." />
          </SectionCard>

          <SectionCard title="Interconsultas">
            <SectionIntro description="Referencia a especialidades con motivo y urgencia." badge="Consulta" />
            <form action={createInterconsultaAction} className="space-y-3">
              <ConsultaContextSelect options={contextosAtencion} defaultValue={defaultAtencion} />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Especialidad destino"><Input name="especialidadDestino" placeholder="Cardiología, Endocrinología..." required /></Field>
                <Field label="Centro destino"><Input name="centroDestino" placeholder="Hospital o clínica de referencia" /></Field>
              </div>
              <Field label="Motivo"><Textarea name="motivo" placeholder="Justificación de la interconsulta" required /></Field>
              <Field label="Urgencia"><Input name="urgencia" placeholder="Baja, media, alta" /></Field>
              <Button type="submit" className="w-full md:w-auto">Referir paciente</Button>
            </form>
            <RecentList items={interconsultas.map((i) => `${i.especialidadDestino} - ${i.motivo}`)} emptyMessage="Sin interconsultas registradas aún." />
          </SectionCard>
        </div>
      )}

      <ModuleIntro
        title="Módulo 3 · Catálogo terapéutico"
        description="Este bloque es administrativo; sirve para mantener medicamentos reutilizables en recetas."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Catálogo de medicamentos">
          <SectionIntro description="Catálogo reutilizable para prescripción." badge="Farmacia" />
          <form action={createMedicamentoAction} className="space-y-3">
            <Field label="Principio activo"><Input name="principioActivo" placeholder="Ej: Acetaminofén" required /></Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nombre comercial"><Input name="nombreComercial" placeholder="Opcional" /></Field>
              <Field label="Presentación"><Input name="presentacion" placeholder="Tableta, suspensión..." /></Field>
              <Field label="Concentración"><Input name="concentracion" placeholder="500 mg" /></Field>
              <Field label="Vía preferida"><Input name="viaPreferida" placeholder="Oral, IV, IM..." /></Field>
            </div>
            <Button type="submit" className="w-full md:w-auto">Agregar medicamento</Button>
          </form>
          <RecentList items={medicamentos.map((m) => m.principioActivo)} emptyMessage="Sin medicamentos en catálogo aún." />
        </SectionCard>
      </div>
    </div>
  );
}

function ModuleIntro({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ConsultaContextSelect({ options, defaultValue }: { options: ContextoAtencionOption[]; defaultValue: string }) {
  return (
    <Field label="Consulta / Cita">
      <select name="consultaId" defaultValue={defaultValue} className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm" required>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionIntro({ description, badge }: { description: string; badge: string }) {
  return (
    <div className="mb-3 space-y-2">
      <Badge variant="secondary">{badge}</Badge>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Separator />
    </div>
  );
}

function RecentList({ items, emptyMessage }: { items: string[]; emptyMessage: string }) {
  return (
    <div className="mt-4 rounded-md border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registros recientes</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((item, idx) => (
            <li key={`${item}-${idx}`} className="line-clamp-1">• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatFechaCita(fecha: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}
