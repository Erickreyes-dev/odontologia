"use client";

import { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "../../components/data-table";
import { deleteIngreso, updateIngreso } from "../../actions";
import { IngresoForm } from "./ingreso-form";

type TipoIngreso = { id: string; nombre: string };
export type IngresoRow = { id:string; fecha:string; tipoIngresoId:string; tipo:string; paciente:string; doctor:string; concepto:string; monto:number; metodoPago:string; origen:string; comentario:string; editable:boolean };
const f=(v:number)=>`L ${Number(v??0).toLocaleString("es-HN",{minimumFractionDigits:2})}`;

function Actions({ row, tiposIngreso }: { row: IngresoRow; tiposIngreso: TipoIngreso[] }) {
  const [open,setOpen]=useState(false); const [pending,startTransition]=useTransition(); const [error,setError]=useState<string|null>(null);
  return <Dialog open={open} onOpenChange={setOpen}><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Acciones</DropdownMenuLabel><DialogTrigger asChild><DropdownMenuItem disabled={!row.editable} onSelect={(e)=>e.preventDefault()}>Editar</DropdownMenuItem></DialogTrigger><DropdownMenuItem disabled={!row.editable||pending} className="text-destructive" onClick={()=>{ if(confirm("¿Eliminar este ingreso manual?")) startTransition(async()=>{const r=await deleteIngreso(row.id); if(!r.ok) setError(r.message??"No se pudo eliminar");});}}>Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu><DialogContent><DialogHeader><DialogTitle>Editar ingreso</DialogTitle></DialogHeader><IngresoForm tiposIngreso={tiposIngreso} initialData={row} submitLabel="Guardar" action={async(payload)=>{const r=await updateIngreso(row.id,payload); if ((r as {ok?:boolean; message?:string}).ok===false) return r as unknown as {ok:false; message?:string}; setOpen(false); return {ok:true};}} />{error?<p className="text-sm text-destructive">{error}</p>:null}</DialogContent></Dialog>;
}

export function IngresosTable({ data, tiposIngreso }: { data: IngresoRow[]; tiposIngreso: TipoIngreso[] }) {
  const columns: ColumnDef<IngresoRow>[] = [
    {accessorKey:"fecha",header:"Fecha"},{accessorKey:"tipo",header:"Tipo"},{accessorKey:"paciente",header:"Paciente"},{accessorKey:"doctor",header:"Doctor"},{accessorKey:"concepto",header:"Concepto"},{accessorKey:"monto",header:"Monto",cell:({row})=>f(row.original.monto)},{accessorKey:"origen",header:"Origen"},{id:"actions",header:"Acciones",cell:({row})=><Actions row={row.original} tiposIngreso={tiposIngreso}/>}];
  return <DataTable columns={columns} data={data} filterPlaceholder="Filtrar ingresos" />;
}
