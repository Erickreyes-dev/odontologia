import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant-query";
import { SectionCard } from "./components/SectionCard";
import Link from "next/link";
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

interface MedicinaGeneralPageProps {
  searchParams?: {
    pacienteId?: string;
    consultaId?: string;
  };
}

export default async function MedicinaGeneralPage({ searchParams }: MedicinaGeneralPageProps) {
  const selectedPacienteId = searchParams?.pacienteId ?? "";
  const selectedConsultaId = searchParams?.consultaId ?? "";
  const [pacientes, consultas, historias, alergias, signos, diagnosticos, medicamentos, prescripciones, ordenes, interconsultas, programas] = await Promise.all([
    prisma.paciente.findMany({
      where: await tenantWhere({}),
      select: { id: true, nombre: true, apellido: true },
      take: 40,
      orderBy: { createAt: "desc" },
    }),
    prisma.consulta.findMany({
      where: await tenantWhere({}),
      select: { id: true, cita: { select: { paciente: { select: { nombre: true, apellido: true } } } } },
      take: 40,
      orderBy: { createAt: "desc" },
    }),
    prisma.historiaClinica.findMany({ where: await tenantWhere({}), include: { paciente: true }, take: 8, orderBy: { updateAt: "desc" } }),
    prisma.alergiaPaciente.findMany({ where: await tenantWhere({}), include: { paciente: true }, take: 8, orderBy: { createAt: "desc" } }),
    prisma.signoVital.findMany({ where: await tenantWhere({}), include: { consulta: true }, take: 8, orderBy: { fechaToma: "desc" } }),
    prisma.diagnosticoConsulta.findMany({ where: await tenantWhere({}), include: { consulta: true }, take: 8, orderBy: { createAt: "desc" } }),
    prisma.medicamentoCatalogo.findMany({ where: await tenantWhere({}), take: 8, orderBy: { createAt: "desc" } }),
    prisma.prescripcion.findMany({ where: await tenantWhere({}), include: { items: true }, take: 8, orderBy: { fechaEmision: "desc" } }),
    prisma.ordenEstudio.findMany({ where: await tenantWhere({}), take: 8, orderBy: { fechaSolicitud: "desc" } }),
    prisma.interconsulta.findMany({ where: await tenantWhere({}), take: 8, orderBy: { fechaReferencia: "desc" } }),
    prisma.programaCronicoPaciente.findMany({ where: await tenantWhere({}), include: { paciente: true }, take: 8, orderBy: { createAt: "desc" } }),
  ]);
  const pacienteSeleccionado = pacientes.find((p) => p.id === selectedPacienteId);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Módulos de Medicina General</h1>
      <p className="text-sm text-muted-foreground">Se habilitaron módulos clínicos completos con acciones server-side para capturar y consultar datos del EMR.</p>
      {pacienteSeleccionado && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          Contexto de paciente: <strong>{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</strong>.{" "}
          <Link href={`/pacientes/${pacienteSeleccionado.id}/perfil`} className="underline">
            Ver perfil completo del paciente
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Historia clínica">
          <form action={createHistoriaClinicaAction} className="space-y-2">
            <select name="pacienteId" defaultValue={selectedPacienteId || pacientes[0]?.id} className="w-full rounded border p-2" required>{pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select>
            <textarea name="hpi" placeholder="Enfermedad actual" className="w-full rounded border p-2" />
            <textarea name="antecedentesPersonales" placeholder="Antecedentes personales" className="w-full rounded border p-2" />
            <textarea name="antecedentesFamiliares" placeholder="Antecedentes familiares" className="w-full rounded border p-2" />
            <textarea name="habitos" placeholder="Hábitos" className="w-full rounded border p-2" />
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Guardar</button>
          </form>
          <ul className="mt-3 text-sm">{historias.map((h) => <li key={h.id}>• {h.paciente.nombre} {h.paciente.apellido}</li>)}</ul>
        </SectionCard>

        <SectionCard title="Alergias">
          <form action={createAlergiaPacienteAction} className="space-y-2">
            <select name="pacienteId" defaultValue={selectedPacienteId || pacientes[0]?.id} className="w-full rounded border p-2" required>{pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select>
            <input name="alergeno" placeholder="Alérgeno" className="w-full rounded border p-2" required />
            <input name="reaccion" placeholder="Reacción" className="w-full rounded border p-2" />
            <select name="severidad" className="w-full rounded border p-2" defaultValue="LEVE"><option value="LEVE">Leve</option><option value="MODERADA">Moderada</option><option value="SEVERA">Severa</option></select>
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Agregar</button>
          </form>
          <ul className="mt-3 text-sm">{alergias.map((a) => <li key={a.id}>• {a.alergeno} ({a.severidad})</li>)}</ul>
        </SectionCard>

        <SectionCard title="Signos vitales">
          <form action={createSignoVitalAction} className="grid grid-cols-2 gap-2">
            <select name="consultaId" defaultValue={selectedConsultaId || consultas[0]?.id} className="col-span-2 w-full rounded border p-2" required>{consultas.map((c) => <option key={c.id} value={c.id}>{c.id.slice(0, 8)} - {c.cita.paciente.nombre} {c.cita.paciente.apellido}</option>)}</select>
            <input type="number" name="tensionSistolica" placeholder="TA Sistólica" className="rounded border p-2" />
            <input type="number" name="tensionDiastolica" placeholder="TA Diastólica" className="rounded border p-2" />
            <input type="number" name="frecuenciaCardiaca" placeholder="FC" className="rounded border p-2" />
            <input type="number" step="0.1" name="temperatura" placeholder="Temp" className="rounded border p-2" />
            <input type="number" name="saturacionOxigeno" placeholder="SatO2" className="rounded border p-2" />
            <input type="number" step="0.01" name="pesoKg" placeholder="Peso" className="rounded border p-2" />
            <input type="number" step="0.01" name="tallaM" placeholder="Talla" className="rounded border p-2" />
            <textarea name="examenFisico" placeholder="Examen físico" className="col-span-2 w-full rounded border p-2" />
            <button className="col-span-2 rounded bg-primary px-3 py-2 text-primary-foreground">Registrar</button>
          </form>
          <ul className="mt-3 text-sm">{signos.map((s) => <li key={s.id}>• {s.consultaId.slice(0, 8)} TA {s.tensionSistolica ?? "-"}/{s.tensionDiastolica ?? "-"}</li>)}</ul>
        </SectionCard>

        <SectionCard title="Diagnósticos CIE-10">
          <form action={createDiagnosticoAction} className="space-y-2">
            <select name="consultaId" defaultValue={selectedConsultaId || consultas[0]?.id} className="w-full rounded border p-2" required>{consultas.map((c) => <option key={c.id} value={c.id}>{c.id.slice(0, 8)} - {c.cita.paciente.nombre} {c.cita.paciente.apellido}</option>)}</select>
            <input name="codigo" placeholder="Código CIE-10" className="w-full rounded border p-2" />
            <input name="descripcion" placeholder="Descripción" className="w-full rounded border p-2" required />
            <select name="estado" className="w-full rounded border p-2" defaultValue="SOSPECHA"><option value="SOSPECHA">Sospecha</option><option value="CONFIRMADO">Confirmado</option><option value="DESCARTADO">Descartado</option></select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="principal" /> Diagnóstico principal</label>
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Agregar</button>
          </form>
          <ul className="mt-3 text-sm">{diagnosticos.map((d) => <li key={d.id}>• {d.codigo ?? "SN"} - {d.descripcion}</li>)}</ul>
        </SectionCard>

        <SectionCard title="Catálogo de medicamentos">
          <form action={createMedicamentoAction} className="space-y-2">
            <input name="principioActivo" placeholder="Principio activo" className="w-full rounded border p-2" required />
            <input name="nombreComercial" placeholder="Nombre comercial" className="w-full rounded border p-2" />
            <input name="presentacion" placeholder="Presentación" className="w-full rounded border p-2" />
            <input name="concentracion" placeholder="Concentración" className="w-full rounded border p-2" />
            <input name="viaPreferida" placeholder="Vía preferida" className="w-full rounded border p-2" />
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Agregar</button>
          </form>
          <ul className="mt-3 text-sm">{medicamentos.map((m) => <li key={m.id}>• {m.principioActivo}</li>)}</ul>
        </SectionCard>

        <SectionCard title="Prescripciones">
          <form action={createPrescripcionAction} className="space-y-2">
            <select name="consultaId" defaultValue={selectedConsultaId || consultas[0]?.id} className="w-full rounded border p-2" required>{consultas.map((c) => <option key={c.id} value={c.id}>{c.id.slice(0, 8)} - {c.cita.paciente.nombre} {c.cita.paciente.apellido}</option>)}</select>
            <textarea name="indicacionesGenerales" placeholder="Indicaciones generales" className="w-full rounded border p-2" />
            <select name="medicamentoId" className="w-full rounded border p-2"><option value="">Medicamento (opcional)</option>{medicamentos.map((m) => <option key={m.id} value={m.id}>{m.principioActivo}</option>)}</select>
            <input name="descripcionLibre" placeholder="Descripción libre" className="w-full rounded border p-2" />
            <div className="grid grid-cols-2 gap-2">
              <input name="dosis" placeholder="Dosis" className="rounded border p-2" required />
              <input name="via" placeholder="Vía" className="rounded border p-2" required />
              <input name="frecuencia" placeholder="Frecuencia" className="rounded border p-2" required />
              <input name="duracion" placeholder="Duración" className="rounded border p-2" required />
            </div>
            <input name="indicacion" placeholder="Indicación" className="w-full rounded border p-2" />
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Crear receta</button>
          </form>
          <ul className="mt-3 text-sm">{prescripciones.map((p) => <li key={p.id}>• Prescripción {p.id.slice(0, 8)} ({p.items.length} item)</li>)}</ul>
        </SectionCard>

        <SectionCard title="Órdenes de estudio">
          <form action={createOrdenEstudioAction} className="space-y-2">
            <select name="consultaId" defaultValue={selectedConsultaId || consultas[0]?.id} className="w-full rounded border p-2" required>{consultas.map((c) => <option key={c.id} value={c.id}>{c.id.slice(0, 8)} - {c.cita.paciente.nombre} {c.cita.paciente.apellido}</option>)}</select>
            <select name="tipo" className="w-full rounded border p-2" defaultValue="LABORATORIO"><option value="LABORATORIO">Laboratorio</option><option value="IMAGEN">Imagen</option><option value="OTRO">Otro</option></select>
            <input name="estudioNombre" placeholder="Estudio" className="w-full rounded border p-2" required />
            <textarea name="indicacion" placeholder="Indicación" className="w-full rounded border p-2" />
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Solicitar</button>
          </form>
          <ul className="mt-3 text-sm">{ordenes.map((o) => <li key={o.id}>• {o.tipo}: {o.estudioNombre} ({o.estado})</li>)}</ul>
        </SectionCard>

        <SectionCard title="Interconsultas">
          <form action={createInterconsultaAction} className="space-y-2">
            <select name="consultaId" defaultValue={selectedConsultaId || consultas[0]?.id} className="w-full rounded border p-2" required>{consultas.map((c) => <option key={c.id} value={c.id}>{c.id.slice(0, 8)} - {c.cita.paciente.nombre} {c.cita.paciente.apellido}</option>)}</select>
            <input name="especialidadDestino" placeholder="Especialidad destino" className="w-full rounded border p-2" required />
            <input name="centroDestino" placeholder="Centro destino" className="w-full rounded border p-2" />
            <textarea name="motivo" placeholder="Motivo" className="w-full rounded border p-2" required />
            <input name="urgencia" placeholder="Urgencia" className="w-full rounded border p-2" />
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Referir</button>
          </form>
          <ul className="mt-3 text-sm">{interconsultas.map((i) => <li key={i.id}>• {i.especialidadDestino} - {i.motivo}</li>)}</ul>
        </SectionCard>

        <SectionCard title="Programas crónicos">
          <form action={createProgramaCronicoAction} className="space-y-2">
            <select name="pacienteId" defaultValue={selectedPacienteId || pacientes[0]?.id} className="w-full rounded border p-2" required>{pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}</select>
            <select name="tipo" className="w-full rounded border p-2" defaultValue="HTA"><option value="HTA">HTA</option><option value="DM2">DM2</option><option value="DISLIPIDEMIA">Dislipidemia</option><option value="OBESIDAD">Obesidad</option><option value="ASMA_EPOC">Asma/EPOC</option><option value="OTRO">Otro</option></select>
            <input name="nombrePersonalizado" placeholder="Nombre personalizado" className="w-full rounded border p-2" />
            <input name="metaClinica" placeholder="Meta clínica" className="w-full rounded border p-2" />
            <textarea name="observaciones" placeholder="Observaciones" className="w-full rounded border p-2" />
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground">Agregar</button>
          </form>
          <ul className="mt-3 text-sm">{programas.map((p) => <li key={p.id}>• {p.paciente.nombre} {p.paciente.apellido} - {p.tipo}</li>)}</ul>
        </SectionCard>
      </div>
    </div>
  );
}
