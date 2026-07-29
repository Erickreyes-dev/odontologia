"use client";

import { Download } from "lucide-react";
import { jsPDF } from "jspdf";

type EstadoResultadosPdfData = {
  month: number;
  year: number;
  ingresosServicios: number;
  otrosIngresos: number;
  totalIngresos: number;
  honorariosMedicos: number;
  costosPorTipo: Record<string, number>;
  costos: number;
  utilidadBruta: number;
  gastosOperacionPorTipo: Record<string, number>;
  gastosOperacion: number;
  utilidadOperativa: number;
  gastosFinancierosPorTipo: Record<string, number>;
  gastosFinancieros: number;
  utilidadAntesImpuestos: number;
  impuestosPorTipo: Record<string, number>;
  impuestosRegistrados: number;
  impuestoConfiguracion: { activo: boolean; nombre: string; tasa: number };
  impuestoCalculado: number;
  impuestos: number;
  utilidadNeta: number;
};

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const money = (value: number) => `L ${value.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function EstadoResultadosPdfButton({ data }: { data: EstadoResultadosPdfData }) {
  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18;

    const row = (label: string, value: number, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(label, 16, y);
      doc.text(money(value), pageWidth - 16, y, { align: "right" });
      y += 7;
    };
    const section = (title: string) => {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.text(title, 16, y);
      y += 7;
    };
    const rowsByType = (items: Record<string, number>) => {
      const entries = Object.entries(items);
      if (entries.length === 0) row("Sin movimientos", 0);
      entries.forEach(([label, value]) => row(label, value));
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Estado de resultados", 16, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${months[data.month - 1] ?? data.month} ${data.year}`, 16, y);
    y += 8;

    section("Ingresos");
    row("Ingreso por servicios", data.ingresosServicios);
    row("Otros ingresos", data.otrosIngresos);
    row("Total de ingresos", data.totalIngresos, true);

    section("Costos (-)");
    row("Honorarios", data.honorariosMedicos);
    rowsByType(data.costosPorTipo);
    row("Total de costos", data.costos, true);
    row("Utilidad bruta", data.utilidadBruta, true);

    section("Gastos de operación (-)");
    rowsByType(data.gastosOperacionPorTipo);
    row("Total gastos de operación", data.gastosOperacion, true);
    row("Utilidad operativa", data.utilidadOperativa, true);

    section("Gastos financieros (-)");
    rowsByType(data.gastosFinancierosPorTipo);
    row("Total gastos financieros", data.gastosFinancieros, true);
    row("Utilidad antes de impuestos", data.utilidadAntesImpuestos, true);

    section("Impuestos (-)");
    rowsByType(data.impuestosPorTipo);
    if (data.impuestoConfiguracion.activo) row(`${data.impuestoConfiguracion.nombre} (${data.impuestoConfiguracion.tasa}%)`, data.impuestoCalculado, true);
    row("Total impuestos", data.impuestos, true);
    row("Utilidad neta", data.utilidadNeta, true);

    doc.save(`estado_resultados_${data.year}_${String(data.month).padStart(2, "0")}.pdf`);
  };

  return <button type="button" onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"><Download className="h-4 w-4" /> Descargar PDF</button>;
}
