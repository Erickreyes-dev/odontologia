"use client";

import * as React from "react";
import { DataTable } from "./data-table";
import { getCitas } from "../actions";
import { columns } from "./columns";
import { Cita } from "../schema";

interface CitaTableProps {
  initialData: {
    data: Cita[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
  from?: string;
  to?: string;
}

export function CitaTable({ initialData, from, to }: CitaTableProps) {
  const [data, setData] = React.useState(initialData.data);
  const [page, setPage] = React.useState(initialData.page);
  const [pageSize] = React.useState(initialData.pageSize);
  const [pageCount, setPageCount] = React.useState(initialData.pageCount);

  React.useEffect(() => {
    setData(initialData.data);
    setPage(initialData.page);
    setPageCount(initialData.pageCount);
  }, [initialData]);

  const handlePageChange = React.useCallback(async (newPage: number, search?: string) => {
    if (newPage < 1) return;

    const res = await getCitas({ page: newPage, pageSize, from, to, search });

    setData(res.data);
    setPage(res.page);
    setPageCount(res.pageCount);
  }, [from, pageSize, to]);

  return (
    <DataTable
      columns={columns}
      data={data}
      page={page}
      pageSize={pageSize}
      pageCount={pageCount}
      onPageChange={handlePageChange}
    />
  );
}
