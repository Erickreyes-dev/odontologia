"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

type ExportExcelButtonProps = {
  data: Record<string, unknown>[];
  fileName: string;
};

function normalizeValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

export function ExportExcelButton({ data, fileName }: ExportExcelButtonProps) {
  const handleExport = () => {
    const normalizedData = data.map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]))
    );

    const worksheet = XLSX.utils.json_to_sheet(normalizedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <Button type="button" variant="outline" onClick={handleExport} className="w-full md:w-auto">
      <Download className="mr-2 h-4 w-4" />
      Descargar Excel
    </Button>
  );
}
