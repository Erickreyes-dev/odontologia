import { getHonorarios } from "../actions";
import { HonorariosTable } from "./components/honorarios-table";

const dateInput = (d: Date | null) => d ? d.toISOString().slice(0, 10) : "-";
const f=(v:number)=>`L ${Number(v??0).toLocaleString("es-HN",{minimumFractionDigits:2})}`;

export default async function HonorariosPage(){
  const rows=await getHonorarios();
  const data=rows.map(h=>({id:h.id,fecha:dateInput(h.fechaGenerado),fechaLiquidado:dateInput(h.fechaLiquidado),doctor:`${h.medico.empleado.nombre} ${h.medico.empleado.apellido}`,paciente:h.paciente?`${h.paciente.nombre} ${h.paciente.apellido}`:"-",servicio:h.servicio?.nombre??"-",total:Number(h.totalServicio),porcentaje:Number(h.porcentaje),comision:Number(h.comision),estado:h.estado,comentario:h.comentario??"-"}));
  const totalIngresos = data.reduce((acc,h)=>acc+h.total,0);
  const totalLiquidado = data.filter(h=>h.estado==="LIQUIDADO").reduce((acc,h)=>acc+h.comision,0);
  const totalPendiente = data.filter(h=>h.estado!=="LIQUIDADO").reduce((acc,h)=>acc+h.comision,0);
  const cards=[{label:"Ingresos",value:f(totalIngresos)},{label:"Liquidados",value:f(totalLiquidado)},{label:"Pendientes",value:f(totalPendiente)}];

  return <div className="space-y-4 p-4"><h1 className="text-2xl font-bold">Honorarios médicos</h1><div className="grid gap-3 md:grid-cols-3">{cards.map(card=><div key={card.label} className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{card.label}</p><p className="text-2xl font-semibold">{card.value}</p></div>)}</div><HonorariosTable data={data}/></div>
}
