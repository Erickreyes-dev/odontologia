import { getHonorarios } from "../actions";
import { HonorariosTable } from "./components/honorarios-table";

export default async function HonorariosPage(){
  const rows=await getHonorarios();
  const data=rows.map(h=>({id:h.id,doctor:`${h.medico.empleado.nombre} ${h.medico.empleado.apellido}`,paciente:h.paciente?`${h.paciente.nombre} ${h.paciente.apellido}`:"-",servicio:h.servicio?.nombre??"-",total:Number(h.totalServicio),porcentaje:Number(h.porcentaje),comision:Number(h.comision),estado:h.estado,comentario:h.comentario??"-"}));
  return <div className="space-y-4 p-4"><h1 className="text-2xl font-bold">Honorarios médicos</h1><HonorariosTable data={data}/></div>
}
