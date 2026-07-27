import { getEstadoResultados } from "../actions";
import { MonthYearFilter } from "../components/month-year-filter";

const f = (v: number) => `L ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

function Row({ l, v, b = false }: { l: string; v: number; b?: boolean }) {
  return <div className={`flex justify-between py-1 ${b ? "font-bold" : ""}`}><span>{l}</span><span>{f(v)}</span></div>;
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

  return <div className="space-y-4 p-4"><h1 className="text-2xl font-bold">Estado de resultados</h1><MonthYearFilter month={month} year={year} /><div className="max-w-2xl rounded-lg border bg-green-50 p-4 text-sm text-green-950"><details open><summary className="cursor-pointer font-bold">Ingresos</summary><Row l="Ingreso por servicios" v={r.ingresosServicios} /><Row l="Otros ingresos" v={r.otrosIngresos} /></details><Row l="Total de ingresos" v={r.totalIngresos} b /><details><summary className="cursor-pointer font-bold">Costos (-)</summary><Row l="Honorarios" v={r.honorariosMedicos} /><RowsByType items={r.costosPorTipo} /></details><Row l="Total de costos" v={r.costos} b /><Row l="Utilidad bruta" v={r.utilidadBruta} b /><details><summary className="cursor-pointer font-bold">Gastos de operación (-)</summary><RowsByType items={r.gastosOperacionPorTipo} /></details><Row l="Total gastos de operación" v={r.gastosOperacion} b /><Row l="Utilidad operativa" v={r.utilidadOperativa} b /><details><summary className="cursor-pointer font-bold">Gastos financieros (-)</summary><RowsByType items={r.gastosFinancierosPorTipo} /></details><Row l="Total gastos financieros" v={r.gastosFinancieros} b /><Row l="Utilidad antes de impuestos" v={r.utilidadAntesImpuestos} b /><details><summary className="cursor-pointer font-bold">Impuestos (-)</summary><RowsByType items={r.impuestosPorTipo} /></details><Row l="Total impuestos" v={r.impuestos} b /><Row l="Utilidad neta" v={r.utilidadNeta} b /></div></div>;
}
