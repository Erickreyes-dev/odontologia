import { getHonorarios } from "../actions";
import { HonorariosClient } from "./components/honorarios-client";

const dateInput = (d: Date | null | undefined) => d ? d.toISOString().slice(0, 10) : "-";

export default async function HonorariosPage(){
  const rows=await getHonorarios();
  const data=rows.map(h=>({id:h.id,fecha:dateInput(h.fechaGenerado),fechaLiquidado:dateInput(h.fechaLiquidado),fechaPago:dateInput(h.ingreso.pago?.fechaPago ?? h.ingreso.fecha),doctor:`${h.medico.empleado.nombre} ${h.medico.empleado.apellido}`,paciente:h.paciente?`${h.paciente.nombre} ${h.paciente.apellido}`:"-",servicio:h.servicio?.nombre??"-",total:Number(h.totalServicio),porcentaje:Number(h.porcentaje),comision:Number(h.comision),estado:h.estado,comentario:h.comentario??"-"}));

  return <div className="space-y-4 p-4"><h1 className="text-2xl font-bold">Honorarios médicos</h1><HonorariosClient data={data}/></div>
}
