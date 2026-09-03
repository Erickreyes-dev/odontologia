"use client";

import * as React from "react";
import { DataTable } from "./data-table";
import { getPacientes, getPacientesParaExportar } from "../actions";
import { columns } from "./columns";
import { PacienteConUltimaConsulta } from "../schema";
import { ColumnFiltersState } from "@tanstack/react-table";

interface PacienteTableProps {
  initialData: {
    data: PacienteConUltimaConsulta[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

export function PacienteTable({ initialData }: PacienteTableProps) {
  const [data, setData] = React.useState(initialData.data);
  const [page, setPage] = React.useState(initialData.page);
  const [pageSize] = React.useState(initialData.pageSize);
  const [pageCount, setPageCount] = React.useState(initialData.pageCount);
  const [, setLoading] = React.useState(false);

  const handlePageChange = React.useCallback(async (newPage: number, search?: string, columnFilters?: ColumnFiltersState) => {
    if (newPage < 1) return;
    setLoading(true);

    const filters = Object.fromEntries(
      (columnFilters ?? []).map((filter) => [filter.id, String(filter.value ?? "")])
    );
    const res = await getPacientes({ page: newPage, pageSize, search, filters });

    setData(res.data);
    setPage(res.page);
    setPageCount(res.pageCount);
    setLoading(false);
  }, [pageSize]);

  const handleExport = React.useCallback(async (search?: string, columnFilters?: ColumnFiltersState) => {
    const filters = Object.fromEntries(
      (columnFilters ?? []).map((filter) => [filter.id, String(filter.value ?? "")])
    );
    return getPacientesParaExportar({ search, filters });
  }, []);

  return (
    <DataTable
      columns={columns}
      data={data}
      page={page}
      pageSize={pageSize}
      pageCount={pageCount}
      onPageChange={handlePageChange}
      onExport={handleExport}
    />
  );
}
