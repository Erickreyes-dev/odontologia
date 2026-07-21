import { getAccountingCatalogs, getIngresos, syncIngresosFromPagos } from "../actions";
import { Button } from "@/components/ui/button";
import { IngresoForm } from "./components/ingreso-form";
import { IngresosTable } from "./components/ingresos-table";

const dateInput = (d: Date) => d.toISOString().slice(0, 10);

function summarizeHonorarios(honorarios: { porcentaje: unknown; comision: unknown; estado: string }[]) {
  if (honorarios.length === 0) return { honorarioPorcentaje: "-", honorarioEstado: "Sin honorario", honorarioLiquidado: 0 };

  const porcentajes = [...new Set(honorarios.map((h) => Number(h.porcentaje ?? 0)))];
  const honorariosLiquidados = honorarios.filter((h) => h.estado === "LIQUIDADO");
  const liquidados = honorariosLiquidados.length;
  const honorarioLiquidado = honorariosLiquidados.reduce((total, h) => total + Number(h.comision ?? 0), 0);
  const honorarioPorcentaje = porcentajes.length === 1 ? `${porcentajes[0]}%` : "Mixto";
  const honorarioEstado = liquidados === honorarios.length ? "Liquidado" : liquidados > 0 ? "Parcial" : "Pendiente";

  return { honorarioPorcentaje, honorarioEstado, honorarioLiquidado };
}

export default async function IngresosPage(){
  const [ingresos,c]=await Promise.all([getIngresos(),getAccountingCatalogs()]);
  const rows = ingresos.map((i)=>({ id:i.id, fecha:dateInput(i.fecha), tipoIngresoId:i.tipoIngresoId, tipo:i.tipoIngreso.nombre, paciente:i.paciente?`${i.paciente.nombre} ${i.paciente.apellido}`:"-", doctor:i.medico?`${i.medico.empleado.nombre} ${i.medico.empleado.apellido}`:"-", concepto:i.concepto, monto:Number(i.monto), metodoPago:i.metodoPago ?? "", origen:i.origen, comentario:i.comentario ?? "", editable:i.editable && i.origen === "MANUAL", ...summarizeHonorarios(i.tipoIngreso.nombre === "Servicio" ? i.honorarios : []) }));
  return <div className="space-y-4 p-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Ingresos</h1><form action={syncIngresosFromPagos}><Button>Sincronizar pagos</Button></form></div><IngresoForm tiposIngreso={c.tiposIngreso}/><IngresosTable data={rows} tiposIngreso={c.tiposIngreso.map(t=>({id:t.id,nombre:t.nombre}))}/></div>
}
