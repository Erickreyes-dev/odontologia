"use client";

import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ConstanciaPdfInput = {
  clinicName: string;
  pacienteNombre: string;
  medicoNombre: string;
  motivo: string;
  diasReposo: number;
  fechaGeneracion?: Date;
};

export function generateConstanciaMedicaPDF(data: ConstanciaPdfInput) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 24;

  const centerText = (text: string, fontSize = 12, gap = 8) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
    y += gap;
  };

  const fecha = data.fechaGeneracion ?? new Date();

  doc.setFont("helvetica", "bold");
  centerText(data.clinicName, 18, 10);

  doc.setFont("helvetica", "normal");
  centerText("CONSTANCIA MÉDICA", 14, 12);

  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y - 4, pageWidth - margin, y - 4);

  doc.setFontSize(11);
  doc.text(`Fecha de generación: ${format(fecha, "dd 'de' MMMM 'de' yyyy", { locale: es })}`, margin, y + 6);
  y += 18;

  const parrafo = [
    "Por medio de la presente se hace constar que el(la) paciente",
    `${data.pacienteNombre}, fue atendido(a) por el(la) médico(a) ${data.medicoNombre}.`,
    `Se indica reposo por ${data.diasReposo} día(s).`,
  ].join(" ");

  const parrafoLines = doc.splitTextToSize(parrafo, pageWidth - margin * 2);
  doc.text(parrafoLines, margin, y);
  y += parrafoLines.length * 6 + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Motivo:", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  const motivoLines = doc.splitTextToSize(data.motivo, pageWidth - margin * 2);
  doc.text(motivoLines, margin, y);
  y += motivoLines.length * 6 + 18;

  const firmaY = Math.max(y, pageHeight - 60);

  doc.line(margin, firmaY, pageWidth / 2 - 10, firmaY);
  doc.line(pageWidth / 2 + 10, firmaY, pageWidth - margin, firmaY);

  doc.setFontSize(10);
  doc.text(data.medicoNombre, margin, firmaY + 6);
  doc.text("Nombre y firma del médico", margin, firmaY + 11);

  doc.text("Sello de la clínica", pageWidth / 2 + 10, firmaY + 11);

  const fileDate = format(fecha, "yyyyMMdd");
  const normalizedName = data.pacienteNombre.replace(/\s+/g, "_");
  doc.save(`constancia_medica_${normalizedName}_${fileDate}.pdf`);
}
