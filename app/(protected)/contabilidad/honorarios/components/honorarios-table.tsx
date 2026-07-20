"use client";

import { useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "../../components/data-table";
import { updateHonorarioEstado } from "../../actions";

export type HonorarioRow = { id:string; doctor:string; paciente:string; servicio:string; total:number; porcentaje:number; comision:number; estado:string; comentario:string };
const f=(v:number)=>`L ${Number(v??0).toLocaleString("es-HN",{minimumFractionDigits:2})}`;
function EstadoButton({ row }: { row: HonorarioRow }) { const [pending,startTransition]=useTransition(); const liquidado=row.estado==="LIQUIDADO"; return <Button size="sm" variant={liquidado?"outline":"default"} disabled={pending} onClick={()=>{ if(liquidado && !confirm("Este honorario ya generó un egreso. Si lo quita de liquidado, se quitará también del egreso. ¿Continuar?")) return; startTransition(async()=>{ await updateHonorarioEstado({id:row.id,estado:liquidado?"PENDIENTE":"LIQUIDADO"}); }); }}>{liquidado?"Pendiente":"Liquidar"}</Button> }
export function HonorariosTable({ data }: { data: HonorarioRow[] }) { const columns:ColumnDef<HonorarioRow>[]=[{accessorKey:"doctor",header:"Doctor"},{accessorKey:"paciente",header:"Paciente"},{accessorKey:"servicio",header:"Servicio"},{accessorKey:"total",header:"Total",cell:({row})=>f(row.original.total)},{accessorKey:"porcentaje",header:"%",cell:({row})=>`${row.original.porcentaje}%`},{accessorKey:"comision",header:"Comisión",cell:({row})=>f(row.original.comision)},{accessorKey:"estado",header:"Estado"},{accessorKey:"comentario",header:"Comentario"},{id:"actions",header:"Acciones",cell:({row})=><EstadoButton row={row.original}/> }]; return <DataTable columns={columns} data={data} filterPlaceholder="Filtrar honorarios"/> }
