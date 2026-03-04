"use client";

import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Recibo } from "@/app/(protected)/pagos/schema";

type ClinicInfo = {
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
};

const formatCurrency = (amount: number, moneda: string) =>
  `${moneda} ${amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generateReciboPDF(recibo: Recibo, clinicInfo: ClinicInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.text(clinicInfo.nombre, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 6;
  if (clinicInfo.telefono) doc.text(`Tel: ${clinicInfo.telefono}`, margin, y);
  y += 5;
  if (clinicInfo.correo) doc.text(`Correo: ${clinicInfo.correo}`, margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const title = "RECIBO DE PAGO";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth - margin - titleWidth, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`No. ${recibo.numero}`, pageWidth - margin - 35, 27);

  y = 44;
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Datos del cliente", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 6;
  doc.text(`Cliente: ${recibo.pacienteNombre}`, margin, y);
  y += 5;
  doc.text(`Identidad: ${recibo.pacienteIdentidad ?? "N/A"}`, margin, y);
  y += 5;
  doc.text(`Teléfono: ${recibo.pacienteTelefono ?? "N/A"}`, margin, y);

  const rightColX = pageWidth / 2 + 6;
  let rightY = 50;
  doc.text(`Fecha emisión: ${format(new Date(recibo.fechaEmision), "PPP p", { locale: es })}`, rightColX, rightY);
  rightY += 5;
  doc.text(`Fecha pago: ${format(new Date(recibo.fechaPago), "PPP p", { locale: es })}`, rightColX, rightY);
  rightY += 5;
  doc.text(`Método de pago: ${recibo.metodoPago}`, rightColX, rightY);
  rightY += 5;
  doc.text(`Referencia: ${recibo.referenciaPago || "N/A"}`, rightColX, rightY);

  y += 12;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Detalle", margin, y);
  y += 6;

  doc.setFillColor(30, 64, 175);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
  doc.setFontSize(9);
  doc.text("Descripción", margin + 2, y + 1.5);
  doc.text("Cant.", margin + 110, y + 1.5);
  doc.text("Precio", margin + 130, y + 1.5);
  doc.text("Subtotal", margin + 160, y + 1.5);
  y += 8;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  recibo.detalles.forEach((detalle, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, pageWidth - margin * 2, 7, "F");
    }
    doc.text(detalle.descripcion, margin + 2, y + 1.5);
    doc.text(String(detalle.cantidad), margin + 110, y + 1.5);
    doc.text(formatCurrency(detalle.precioUnitario, recibo.moneda), margin + 130, y + 1.5);
    doc.text(formatCurrency(detalle.subtotal, recibo.moneda), margin + 160, y + 1.5);
    y += 7;
  });

  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - 85, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal: ${formatCurrency(recibo.subtotal, recibo.moneda)}`, pageWidth - 80, y);
  y += 5;
  doc.text(`Descuento: ${formatCurrency(recibo.descuento, recibo.moneda)}`, pageWidth - 80, y);
  y += 5;
  doc.text(`Impuesto: ${formatCurrency(recibo.impuesto, recibo.moneda)}`, pageWidth - 80, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52);
  doc.text(`TOTAL PAGADO: ${formatCurrency(recibo.total, recibo.moneda)}`, pageWidth - 80, y);

  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  doc.text(`Concepto de orden: ${recibo.ordenConcepto}`, margin, y);
  y += 5;
  doc.text(`Tipo de recibo: ${recibo.tipoConcepto}`, margin, y);

  if (recibo.notas) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Notas:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const notes = doc.splitTextToSize(recibo.notas, pageWidth - margin * 2);
    doc.text(notes, margin, y);
  }

  const footerY = doc.internal.pageSize.getHeight() - 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Documento generado el ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}.`,
    margin,
    footerY
  );

  doc.save(`recibo_${recibo.numero}.pdf`);
}
