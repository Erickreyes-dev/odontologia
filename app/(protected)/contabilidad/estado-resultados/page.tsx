import { getEstadoResultados, updateEstadoResultadosImpuesto } from "../actions";
import { MonthYearFilter } from "../components/month-year-filter";
import { EstadoResultadosPdfButton } from "./components/estado-resultados-pdf-button";

const f = (v: number) => `L ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

function Row({ l, v, b = false, className = "" }: { l: string; v: number; b?: boolean; className?: string }) {
  return <div className={`flex justify-between py-1 ${b ? "font-bold" : ""} ${className}`}><span>{l}</span><span>{f(v)}</span></div>;
}

function RowsByType({ items }: { items: Record<string, number> }) {
  const entries = Object.entries(items);
  if (entries.length === 0) return <Row l="Sin movimientos" v={0} />;
  return entries.map(([k, v]) => <Row key={k} l={k} v={v} />);
}

export default async function EstadoResultadosPage({ searchParams }: { searchParams: { month?: string; year?: string } }) {
  const d = new Date();
  const month = Number(searchParams.month ?? d.getMonth() + 1);
  const year = Number(searchParams.year ?? d.getFullYear());
  const r = await getEstadoResultados(year, month);
  const saveTaxConfig = async (formData: FormData) => {
    "use server";
    await updateEstadoResultadosImpuesto({
      activo: formData.get("activo") === "1",
      nombre: String(formData.get("nombre") ?? "Impuesto ISV"),
      tasa: Number(formData.get("tasa") ?? 15),
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Estado de resultados</h1>
        <EstadoResultadosPdfButton data={r} />
      </div>
      <MonthYearFilter month={month} year={year} />
      <form action={saveTaxConfig} className="max-w-2xl rounded-lg border bg-white p-4 text-sm shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 font-medium">
            <input name="activo" type="checkbox" value="1" defaultChecked={r.impuestoConfiguracion.activo} className="h-4 w-4" />
            Aplicar impuesto guardado al estado de resultados
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Nombre del impuesto</span>
            <input name="nombre" required maxLength={80} defaultValue={r.impuestoConfiguracion.nombre} className="w-44 rounded-md border p-2" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Tasa (%)</span>
            <input name="tasa" type="number" min="0" max="100" step="0.01" defaultValue={r.impuestoConfiguracion.tasa} className="w-28 rounded-md border p-2" />
          </label>
          <button className="rounded-md border px-4 py-2">Guardar configuración</button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Esta configuración queda guardada para el tenant y se calcula sobre la utilidad antes de impuestos.
        </p>
      </form>
      <div className="max-w-2xl rounded-lg border bg-green-50 p-4 text-sm text-green-950">
        <details open><summary className="cursor-pointer font-bold">Ingresos</summary><Row l="Ingreso por servicios" v={r.ingresosServicios} /><Row l="Otros ingresos" v={r.otrosIngresos} /></details>
        <Row l="Total de ingresos" v={r.totalIngresos} b />
        <details><summary className="cursor-pointer font-bold">Costos (-)</summary><Row l="Honorarios" v={r.honorariosMedicos} /><RowsByType items={r.costosPorTipo} /></details>
        <Row l="Total de costos" v={r.costos} b />
        <Row l="Utilidad bruta" v={r.utilidadBruta} b />
        <details><summary className="cursor-pointer font-bold">Gastos de operación (-)</summary><RowsByType items={r.gastosOperacionPorTipo} /></details>
        <Row l="Total gastos de operación" v={r.gastosOperacion} b />
        <Row l="Utilidad operativa" v={r.utilidadOperativa} b />
        <details><summary className="cursor-pointer font-bold">Gastos financieros (-)</summary><RowsByType items={r.gastosFinancierosPorTipo} /></details>
        <Row l="Total gastos financieros" v={r.gastosFinancieros} b />
        <Row l="Utilidad antes de impuestos" v={r.utilidadAntesImpuestos} b />
        <details open={r.impuestoConfiguracion.activo}><summary className="cursor-pointer font-bold">Impuestos (-)</summary><RowsByType items={r.impuestosPorTipo} />{r.impuestoConfiguracion.activo ? <Row l={`${r.impuestoConfiguracion.nombre} (${r.impuestoConfiguracion.tasa}%)`} v={r.impuestoCalculado} className="rounded-md bg-yellow-100 px-2 text-yellow-950" /> : null}</details>
        <Row l="Total impuestos" v={r.impuestos} b className={r.impuestoConfiguracion.activo ? "rounded-md bg-yellow-100 px-2 text-yellow-950" : ""} />
        <Row l="Utilidad neta" v={r.utilidadNeta} b />
      </div>
    </div>
  );
}
