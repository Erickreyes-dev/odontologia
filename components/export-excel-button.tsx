"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { useState } from "react";

type ExportExcelButtonProps = {
  data: Record<string, unknown>[];
  fileName: string;
  getData?: () => Promise<Record<string, unknown>[]>;
};

function normalizeValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

function isIdColumn(key: string): boolean {
  return /(^id$|_id$|Id$)/.test(key);
}

export function ExportExcelButton({ data, fileName, getData }: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = getData ? await getData() : data;
      const normalizedData = exportData.map((row) =>
      Object.fromEntries(
        Object.entries(row)
          .filter(([key]) => !isIdColumn(key))
          .map(([key, value]) => [key, normalizeValue(value)])
      )
      );

      const worksheet = XLSX.utils.json_to_sheet(normalizedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={handleExport} className="w-full md:w-auto" disabled={isExporting}>
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Preparando Excel..." : "Descargar Excel"}
    </Button>
  );
}
