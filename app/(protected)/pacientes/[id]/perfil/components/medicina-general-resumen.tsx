import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function MedicinaGeneralResumen({ pacienteId }: { pacienteId: string }) {
  const consultas = await prisma.consulta.findMany({
    where: await tenantWhere({ cita: { pacienteId } }),
    select: { id: true, fechaConsulta: true },
    orderBy: { fechaConsulta: "desc" },
    take: 20,
  });

  const consultaIds = consultas.map((c) => c.id);

  const [historia, alergias, signos, diagnosticos, prescripciones, ordenes, interconsultas, programas] = await Promise.all([
    prisma.historiaClinica.findUnique({ where: { pacienteId } }),
    prisma.alergiaPaciente.findMany({ where: await tenantWhere({ pacienteId, activo: true }), take: 10, orderBy: { createAt: "desc" } }),
    consultaIds.length
      ? prisma.signoVital.findMany({ where: await tenantWhere({ consultaId: { in: consultaIds } }), take: 10, orderBy: { fechaToma: "desc" } })
      : Promise.resolve([]),
    consultaIds.length
      ? prisma.diagnosticoConsulta.findMany({ where: await tenantWhere({ consultaId: { in: consultaIds } }), take: 10, orderBy: { createAt: "desc" } })
      : Promise.resolve([]),
    consultaIds.length
      ? prisma.prescripcion.findMany({ where: await tenantWhere({ consultaId: { in: consultaIds } }), include: { items: true }, take: 10, orderBy: { fechaEmision: "desc" } })
      : Promise.resolve([]),
    consultaIds.length
      ? prisma.ordenEstudio.findMany({ where: await tenantWhere({ consultaId: { in: consultaIds } }), include: { resultados: true }, take: 10, orderBy: { fechaSolicitud: "desc" } })
      : Promise.resolve([]),
    consultaIds.length
      ? prisma.interconsulta.findMany({ where: await tenantWhere({ consultaId: { in: consultaIds } }), take: 10, orderBy: { fechaReferencia: "desc" } })
      : Promise.resolve([]),
    prisma.programaCronicoPaciente.findMany({ where: await tenantWhere({ pacienteId, activo: true }), take: 10, orderBy: { createAt: "desc" } }),
  ]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Resumen clínico de medicina general</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-md border p-3">
          <p className="font-medium">Historia clínica</p>
          <p className="text-muted-foreground">{historia?.hpi ? `HPI: ${historia.hpi}` : "Sin historia clínica estructurada aún."}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="font-medium">Alergias activas ({alergias.length})</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {alergias.length ? alergias.map((a) => <li key={a.id}>• {a.alergeno} ({a.severidad})</li>) : <li>Sin alergias registradas.</li>}
            </ul>
          </div>

          <div className="rounded-md border p-3">
            <p className="font-medium">Programas crónicos activos ({programas.length})</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {programas.length ? programas.map((p) => <li key={p.id}>• {p.tipo}{p.metaClinica ? ` · Meta: ${p.metaClinica}` : ""}</li>) : <li>Sin programas activos.</li>}
            </ul>
          </div>

          <div className="rounded-md border p-3">
            <p className="font-medium">Últimos signos vitales ({signos.length})</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {signos.length ? signos.map((s) => <li key={s.id}>• TA {s.tensionSistolica ?? "-"}/{s.tensionDiastolica ?? "-"} · FC {s.frecuenciaCardiaca ?? "-"}</li>) : <li>Sin signos vitales.</li>}
            </ul>
          </div>

          <div className="rounded-md border p-3">
            <p className="font-medium">Diagnósticos recientes ({diagnosticos.length})</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {diagnosticos.length ? diagnosticos.map((d) => <li key={d.id}>• {d.codigo ?? "SN"} - {d.descripcion}</li>) : <li>Sin diagnósticos.</li>}
            </ul>
          </div>

          <div className="rounded-md border p-3">
            <p className="font-medium">Prescripciones ({prescripciones.length})</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {prescripciones.length ? prescripciones.map((p) => <li key={p.id}>• Receta {p.id.slice(0, 8)} · {p.items.length} item(s)</li>) : <li>Sin recetas.</li>}
            </ul>
          </div>

          <div className="rounded-md border p-3">
            <p className="font-medium">Órdenes de estudio ({ordenes.length})</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {ordenes.length ? ordenes.map((o) => <li key={o.id}>• {o.tipo} - {o.estudioNombre} ({o.estado})</li>) : <li>Sin órdenes.</li>}
            </ul>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <p className="font-medium">Interconsultas ({interconsultas.length})</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {interconsultas.length ? interconsultas.map((i) => <li key={i.id}>• {i.especialidadDestino} - {i.motivo}</li>) : <li>Sin interconsultas.</li>}
          </ul>
        </div>

        <div>
          <Link href={`/medicina-general?pacienteId=${pacienteId}`} className="underline">
            Ir al módulo de medicina general con este paciente preseleccionado
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
