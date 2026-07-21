"use client";

import * as React from "react";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTableProps<TData, TValue> { columns: ColumnDef<TData, TValue>[]; data: TData[]; filterPlaceholder?: string }

export function DataTable<TData, TValue>({ columns, data, filterPlaceholder = "Filtrar datos" }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const table = useReactTable({
    data, columns, state: { sorting, globalFilter }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row) => Object.values(row.original as Record<string, unknown>).some((value) => String(value).toLowerCase().includes(globalFilter.toLowerCase())),
  });
  return <div className="rounded-md border p-4"><div className="flex items-center py-4"><Input placeholder={filterPlaceholder} value={globalFilter} onChange={(e)=>setGlobalFilter(e.target.value)} className="max-w-sm" /></div><div className="rounded-md border"><Table><TableHeader>{table.getHeaderGroups().map((hg)=><TableRow key={hg.id}>{hg.headers.map((h)=><TableHead key={h.id}>{h.isPlaceholder?null:h.column.getCanSort()?<Button variant="ghost" onClick={()=>h.column.toggleSorting(h.column.getIsSorted()==="asc")}>{flexRender(h.column.columnDef.header,h.getContext())}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>:flexRender(h.column.columnDef.header,h.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length?table.getRowModel().rows.map((row)=><TableRow key={row.id}>{row.getVisibleCells().map((cell)=><TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</TableCell>)}</TableRow>):<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Sin resultados.</TableCell></TableRow>}</TableBody></Table></div><div className="flex items-center justify-end gap-2 py-4"><Button variant="outline" size="sm" onClick={()=>table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button><Button variant="outline" size="sm" onClick={()=>table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button></div></div>;
}
