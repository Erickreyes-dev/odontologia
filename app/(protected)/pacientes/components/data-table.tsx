/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // paginación del servidor
  page: number;            // página actual (1,2,3...)
  pageSize: number;        // tamaño de página
  pageCount: number;       // total de páginas (viene del backend)
  onPageChange: (page: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  pageSize,
  pageCount,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true, // 👈 paginación controlada por el servidor

    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: page - 1, // TanStack usa índice base 0
        pageSize,
      },
    },

    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: page - 1, pageSize })
          : updater;

      // volver a 1-based para tu backend
      onPageChange(next.pageIndex + 1);
    },

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    // filtro global simple por texto
    globalFilterFn: (row) => {
      const values = Object.values(row.original as any);
      return values.some((value) =>
        String(value).toLowerCase().includes(globalFilter.toLowerCase())
      );
    },
  });

  return (
    <div className="rounded-md border p-4">
      {/* Buscador + botón nuevo */}
      <div className="flex flex-col md:flex-row items-center py-4 justify-between gap-2">
        <Input
          placeholder="Filtrar datos..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full md:max-w-sm"
        />

        <Link href="/pacientes/create" className="w-full md:w-auto">
          <Button className="w-full md:w-auto flex items-center gap-2">
            Nuevo paciente
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pb-3">
        {table
          .getAllLeafColumns()
          .filter((column) => column.getCanFilter() && column.id !== "actions")
          .map((column) => (
            <Input
              key={column.id}
              placeholder={`Filtrar ${column.id}...`}
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
            />
          ))}
      </div>

      {/* Tabla */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {data.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-between py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </Button>

        <span className="text-sm text-muted-foreground">
          Página {page} de {pageCount}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
