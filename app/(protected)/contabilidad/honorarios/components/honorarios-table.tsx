"use client";

import { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "../../components/data-table";
import { updateHonorario, updateHonorarioEstado } from "../../actions";

export type HonorarioRow = { id:string; fecha:string; fechaLiquidado:string; fechaPago:string; doctor:string; paciente:string; servicio:string; total:number; porcentaje:number; comision:number; estado:string; comentario:string };
const f=(v:number)=>`L ${Number(v??0).toLocaleString("es-HN",{minimumFractionDigits:2})}`;

function EstadoButton({ row }: { row: HonorarioRow }) {
  const [pending,startTransition]=useTransition();
  const [open,setOpen]=useState(false);
  const liquidado=row.estado==="LIQUIDADO";

  function updateEstado() {
    startTransition(async()=>{
      await updateHonorarioEstado({id:row.id,estado:liquidado?"PENDIENTE":"LIQUIDADO"});
      setOpen(false);
    });
  }

  if (!liquidado) {
    return <Button size="sm" disabled={pending} onClick={updateEstado}>{pending?"Guardando...":"Liquidar"}</Button>;
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={pending} onClick={()=>setOpen(true)}>Pendiente</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quitar liquidación de honorario</DialogTitle>
            <DialogDescription>
              Este honorario ya generó un egreso automático. Si lo marca como pendiente, también se eliminará ese egreso.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={updateEstado} disabled={pending}>{pending?"Guardando...":"Sí, marcar pendiente"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditHonorarioButton({ row }: { row: HonorarioRow }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [porcentaje, setPorcentaje] = useState(String(row.porcentaje));
  const [comentario, setComentario] = useState(row.comentario === "-" ? "" : row.comentario);

  function save() {
    startTransition(async () => {
      await updateHonorario(row.id, { porcentaje: Number(porcentaje), comentario: comentario || null });
      setOpen(false);
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}>Editar</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar honorario</DialogTitle>
            <DialogDescription>
              Ajusta el porcentaje únicamente para este registro. La comisión se recalculará con el total del servicio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor={`porcentaje-${row.id}`}>Porcentaje</label>
            <Input
              id={`porcentaje-${row.id}`}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={porcentaje}
              onChange={(event) => setPorcentaje(event.target.value)}
            />
            <label className="text-sm font-medium" htmlFor={`comentario-${row.id}`}>Comentario</label>
            <Textarea
              id={`comentario-${row.id}`}
              maxLength={255}
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              placeholder="Motivo del ajuste"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="button" onClick={save} disabled={pending}>{pending ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HonorariosTable({ data }: { data: HonorarioRow[] }) {
  const columns:ColumnDef<HonorarioRow>[]=[
    {accessorKey:"fecha",header:"Fecha generado"},
    {accessorKey:"fechaLiquidado",header:"Fecha liquidado"},
    {accessorKey:"fechaPago",header:"Fecha pago"},
    {accessorKey:"doctor",header:"Doctor"},
    {accessorKey:"paciente",header:"Paciente"},
    {accessorKey:"servicio",header:"Servicio"},
    {accessorKey:"total",header:"Total",cell:({row})=>f(row.original.total)},
    {accessorKey:"porcentaje",header:"%",cell:({row})=>`${row.original.porcentaje}%`},
    {accessorKey:"comision",header:"Comisión",cell:({row})=>f(row.original.comision)},
    {accessorKey:"estado",header:"Estado"},
    {accessorKey:"comentario",header:"Comentario"},
    {id:"actions",header:"Acciones",cell:({row})=><div className="flex flex-wrap gap-2"><EditHonorarioButton row={row.original}/><EstadoButton row={row.original}/></div> }
  ];
  return <DataTable columns={columns} data={data} filterPlaceholder="Filtrar honorarios"/>;
}
