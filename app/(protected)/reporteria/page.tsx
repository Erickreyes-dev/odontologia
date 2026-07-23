import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { getSessionPermisos } from "@/auth";
import { FileSearch } from "lucide-react";
import { getAuditLogs } from "./actions";

function JsonBlock({ value }: { value: unknown }) {
  if (!value) return <span className="text-muted-foreground">Sin detalle</span>;
  return <pre className="max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(value, null, 2)}</pre>;
}

export default async function ReporteriaPage({
  searchParams,
}: {
  searchParams: Promise<{ accion?: string; entidad?: string; desde?: string; hasta?: string }>;
}) {
  const permisos = await getSessionPermisos();
  if (!permisos?.includes("ver_reporteria")) return <NoAcceso />;

  const params = await searchParams;
  const logs = await getAuditLogs({
    accion: params.accion,
    entidad: params.entidad,
    desde: params.desde ? new Date(`${params.desde}T00:00:00`) : undefined,
    hasta: params.hasta ? new Date(`${params.hasta}T23:59:59`) : undefined,
  });

  return (
    <div className="container mx-auto space-y-6 py-4">
      <HeaderComponent Icon={FileSearch} screenName="Reportería" description="Bitácora por tenant de registros, modificaciones y eliminaciones" />

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-5">
        <input className="rounded-md border px-3 py-2" name="desde" type="date" defaultValue={params.desde} />
        <input className="rounded-md border px-3 py-2" name="hasta" type="date" defaultValue={params.hasta} />
        <select className="rounded-md border px-3 py-2" name="accion" defaultValue={params.accion || ""}>
          <option value="">Todas las acciones</option>
          <option value="CREAR">Crear</option>
          <option value="MODIFICAR">Modificar</option>
          <option value="ELIMINAR">Eliminar</option>
        </select>
        <input className="rounded-md border px-3 py-2" name="entidad" placeholder="Entidad (Producto, Paciente...)" defaultValue={params.entidad} />
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" type="submit">Filtrar</button>
      </form>

      <div className="space-y-4">
        {logs.map((log) => (
          <article key={log.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="font-semibold">{log.resumen}</div>
                <div className="text-sm text-muted-foreground">{log.fecha.toLocaleString("es-HN")} · {log.usuario} · {log.ip || "IP no disponible"}</div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-muted px-2 py-1">{log.accion}</span>
                <span className="rounded-full bg-muted px-2 py-1">{log.entidad}</span>
              </div>
            </div>
            {log.detalle ? <p className="mt-3 text-sm">{log.detalle}</p> : null}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium">Ver cambios y valores auditados</summary>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <div><h3 className="mb-2 text-sm font-semibold">Cambios</h3><JsonBlock value={log.cambios} /></div>
                <div><h3 className="mb-2 text-sm font-semibold">Antes</h3><JsonBlock value={log.valoresAntes} /></div>
                <div><h3 className="mb-2 text-sm font-semibold">Después</h3><JsonBlock value={log.valoresDespues} /></div>
              </div>
            </details>
          </article>
        ))}
        {logs.length === 0 ? <div className="rounded-lg border p-8 text-center text-muted-foreground">No hay eventos de auditoría para los filtros seleccionados.</div> : null}
      </div>
    </div>
  );
}
