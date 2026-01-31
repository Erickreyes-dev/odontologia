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
}

export function CitaTable({ initialData }: CitaTableProps) {
  const [data, setData] = React.useState(initialData.data);
  const [page, setPage] = React.useState(initialData.page);
  const [pageSize] = React.useState(initialData.pageSize);
  const [pageCount, setPageCount] = React.useState(initialData.pageCount);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;

    const res = await getCitas({ page: newPage, pageSize });

    setData(res.data);
    setPage(res.page);
    setPageCount(res.pageCount);
  };

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
