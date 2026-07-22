import { getAccountingCatalogs, getEgresos } from "../actions";
import { EgresoForm } from "./components/egreso-form";
import { EgresosTable } from "./components/egresos-table";

const dateInput = (d: Date) => d.toISOString().slice(0, 10);

export default async function EgresosPage(){
  const [rows,c]=await Promise.all([getEgresos(),getAccountingCatalogs()]);
  const catalogs={tiposEgreso:c.tiposEgreso.map(t=>({id:t.id,nombre:t.nombre,descripciones:t.descripciones.map(d=>({id:d.id,nombre:d.nombre}))})),productos:c.productos.map(p=>({id:p.id,nombre:p.nombre})),serviciosLaboratorio:c.serviciosLaboratorio.map(s=>({id:s.id,nombre:s.nombre})),consultasLaboratorio:c.consultasLaboratorio.flatMap(consulta=>consulta.detalles.map(detalle=>({id:consulta.id,servicioId:detalle.servicioId,nombre:`${consulta.cita.paciente.nombre} ${consulta.cita.paciente.apellido} - ${dateInput(consulta.fechaConsulta ?? consulta.createAt)}`}))),equipos:c.equipos.map(e=>({id:e.id,nombre:e.nombre}))};
  const data=rows.map(e=>({id:e.id,fecha:dateInput(e.fecha),tipoEgresoId:e.tipoEgresoId,tipo:e.tipoEgreso.nombre,descripcion:e.descripcionEgreso?.nombre??e.producto?.nombre??e.servicio?.nombre??e.equipo?.nombre??e.descripcionManual??"-",descripcionEgresoId:e.descripcionEgresoId,descripcionManual:e.descripcionManual,productoId:e.productoId,servicioId:e.servicioId,equipoId:e.equipoId,consultaId:e.consultaId,cantidad:Number(e.cantidad),metodoPago:e.metodoPago,monto:Number(e.monto),comentario:e.comentario??"",esAutomatico:e.esAutomatico}));
  return <div className="space-y-4 p-4"><h1 className="text-2xl font-bold">Egresos</h1><EgresoForm catalogs={catalogs}/><EgresosTable data={data} catalogs={catalogs}/></div>
}
