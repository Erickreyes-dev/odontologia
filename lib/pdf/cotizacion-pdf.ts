"use client";

import { jsPDF } from "jspdf";
import { Cotizacion } from "@/app/(protected)/cotizaciones/schema";
import { Paciente } from "@/app/(protected)/pacientes/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CLINIC_NAME = "Clinica Dental";
const CLINIC_ADDRESS = "Tegucigalpa, Honduras";
const CLINIC_PHONE = "Tel: (504) 0000-0000";
const CLINIC_EMAIL = "contacto@clinicadental.com";

export function generateCotizacionPDF(cotizacion: Cotizacion, paciente: Paciente) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper functions
  const centerText = (text: string, y: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  const formatCurrency = (amount: number) => {
    return `L. ${amount.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
  };

  // Header - Clinic Info
  doc.setFont("helvetica", "bold");
  centerText(CLINIC_NAME, yPos, 20);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  centerText(CLINIC_ADDRESS, yPos);
  yPos += 5;
  centerText(CLINIC_PHONE, yPos);
  yPos += 5;
  centerText(CLINIC_EMAIL, yPos);
  yPos += 10;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Title
  doc.setFont("helvetica", "bold");
  centerText("COTIZACION", yPos, 16);
  yPos += 15;

  // Quote info box
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 30, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  // Left column - Patient info
  doc.text("Paciente:", margin + 5, yPos + 5);
  doc.setFont("helvetica", "bold");
  doc.text(`${paciente.nombre} ${paciente.apellido}`, margin + 30, yPos + 5);

  doc.setFont("helvetica", "normal");
  if (paciente.identidad) {
    doc.text("Identidad:", margin + 5, yPos + 12);
    doc.text(paciente.identidad, margin + 30, yPos + 12);
  }

  if (paciente.telefono) {
    doc.text("Telefono:", margin + 5, yPos + 19);
    doc.text(paciente.telefono, margin + 30, yPos + 19);
  }

  // Right column - Quote info
  const rightCol = pageWidth / 2 + 10;
  doc.text("Fecha:", rightCol, yPos + 5);
  doc.text(
    cotizacion.fecha
      ? format(new Date(cotizacion.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
      : "-",
    rightCol + 25,
    yPos + 5
  );

  doc.text("Estado:", rightCol, yPos + 12);
  const estadoMap: Record<string, string> = {
    borrador: "Borrador",
    enviada: "Enviada",
    aceptada: "Aceptada",
    rechazada: "Rechazada",
    parcial: "Parcial",
  };
  doc.text(estadoMap[cotizacion.estado] || cotizacion.estado, rightCol + 25, yPos + 12);

  yPos += 35;

  // Services table
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Detalle de Servicios", margin, yPos);
  yPos += 8;

  // Table header
  const colWidths = {
    servicio: 70,
    cantidad: 25,
    precio: 40,
    subtotal: 40,
  };

  const tableStart = margin;
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255, 255, 255);
  doc.roundedRect(tableStart, yPos - 5, pageWidth - margin * 2, 10, 2, 2, "F");

  doc.setFontSize(10);
  doc.text("Servicio", tableStart + 5, yPos + 2);
  doc.text("Cant.", tableStart + colWidths.servicio + 5, yPos + 2);
  doc.text("Precio Unit.", tableStart + colWidths.servicio + colWidths.cantidad + 5, yPos + 2);
  doc.text("Subtotal", tableStart + colWidths.servicio + colWidths.cantidad + colWidths.precio + 5, yPos + 2);

  yPos += 10;

  // Table rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  if (cotizacion.detalles && cotizacion.detalles.length > 0) {
    cotizacion.detalles.forEach((detalle, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(tableStart, yPos - 5, pageWidth - margin * 2, 10, "F");
      }

      const subtotal = detalle.precioUnitario * detalle.cantidad;

      doc.text(detalle.servicioNombre || "-", tableStart + 5, yPos + 2);
      doc.text(detalle.cantidad.toString(), tableStart + colWidths.servicio + 5, yPos + 2);
      doc.text(
        formatCurrency(detalle.precioUnitario),
        tableStart + colWidths.servicio + colWidths.cantidad + 5,
        yPos + 2
      );
      doc.text(
        formatCurrency(subtotal),
        tableStart + colWidths.servicio + colWidths.cantidad + colWidths.precio + 5,
        yPos + 2
      );

      // Add observation if exists
      if (detalle.observacion) {
        yPos += 8;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`  Nota: ${detalle.observacion}`, tableStart + 5, yPos + 2);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }

      yPos += 10;
    });
  } else {
    doc.text("No hay servicios en esta cotizacion", tableStart + 5, yPos + 2);
    yPos += 10;
  }

  // Total
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - margin - 80, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TOTAL:", pageWidth - margin - 80, yPos);
  doc.setTextColor(41, 128, 185);
  doc.text(formatCurrency(cotizacion.total || 0), pageWidth - margin - 40, yPos);

  // Observations
  if (cotizacion.observacion) {
    yPos += 20;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Observaciones:", margin, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Split long observations into multiple lines
    const splitText = doc.splitTextToSize(cotizacion.observacion, pageWidth - margin * 2);
    doc.text(splitText, margin, yPos);
    yPos += splitText.length * 5;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  centerText("Esta cotizacion tiene una validez de 30 dias a partir de la fecha de emision.", footerY);
  centerText("Precios sujetos a cambio sin previo aviso.", footerY + 5);

  doc.setFontSize(8);
  centerText(
    `Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`,
    footerY + 12
  );

  // Save the PDF
  const fileName = `cotizacion_${paciente.apellido}_${paciente.nombre}_${format(
    cotizacion.fecha ? new Date(cotizacion.fecha) : new Date(),
    "yyyyMMdd"
  )}.pdf`;
  
  doc.save(fileName);
}
