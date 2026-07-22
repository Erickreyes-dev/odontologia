"use client";

import { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "../../components/data-table";
import { deleteEgreso, updateEgreso } from "../../actions";
import { EgresoForm, Catalogs } from "./egreso-form";

export type EgresoRow = { id:string; fecha:string; tipoEgresoId:string; tipo:string; descripcion:string; descripcionEgresoId?:string|null; descripcionManual?:string|null; productoId?:string|null; servicioId?:string|null; equipoId?:string|null; consultaId?:string|null; cantidad:number; metodoPago:string; monto:number; comentario:string; esAutomatico:boolean };
const f=(v:number)=>`L ${Number(v??0).toLocaleString("es-HN",{minimumFractionDigits:2})}`;
function Actions({ row, catalogs }: { row:EgresoRow; catalogs:Catalogs }) { const [open,setOpen]=useState(false); const [pending,startTransition]=useTransition(); const [error,setError]=useState<string|null>(null); return <Dialog open={open} onOpenChange={setOpen}><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Acciones</DropdownMenuLabel><DialogTrigger asChild><DropdownMenuItem disabled={row.esAutomatico} onSelect={(e)=>e.preventDefault()}>Editar</DropdownMenuItem></DialogTrigger><DropdownMenuItem disabled={row.esAutomatico||pending} className="text-destructive" onClick={()=>{ if(confirm("¿Eliminar este egreso?")) startTransition(async()=>{const r=await deleteEgreso(row.id); if(!r.ok) setError(r.message??"No se pudo eliminar");});}}>Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu><DialogContent><DialogHeader><DialogTitle>Editar egreso</DialogTitle></DialogHeader><EgresoForm catalogs={catalogs} initialData={row} submitLabel="Guardar" action={async(payload)=>{const r=await updateEgreso(row.id,payload); if(!r.ok) return r; setOpen(false); return {ok:true};}} />{error?<p className="text-sm text-destructive">{error}</p>:null}</DialogContent></Dialog> }
export function EgresosTable({ data, catalogs }: { data:EgresoRow[]; catalogs:Catalogs }) { const columns:ColumnDef<EgresoRow>[]=[{accessorKey:"fecha",header:"Fecha"},{accessorKey:"tipo",header:"Tipo"},{accessorKey:"descripcion",header:"Descripción"},{accessorKey:"cantidad",header:"Cantidad"},{accessorKey:"metodoPago",header:"Método"},{accessorKey:"monto",header:"Monto",cell:({row})=>f(row.original.monto)},{accessorKey:"comentario",header:"Comentario"},{id:"actions",header:"Acciones",cell:({row})=><Actions row={row.original} catalogs={catalogs}/> }]; return <DataTable columns={columns} data={data} filterPlaceholder="Filtrar egresos"/> }
