import { jsPDF } from "jspdf";

export type RecetaPrintableItem = {
  medicamento: string;
  dosis: string;
  via: string;
  frecuencia: string;
  duracion: string;
  indicacion?: string | null;
};

export type RecetaPrintable = {
  id: string;
  fechaEmision: string;
  pacienteNombre: string;
  consultaId: string;
  indicacionesGenerales?: string | null;
  items: RecetaPrintableItem[];
};

export function generateRecetaMedicaPDF(receta: RecetaPrintable, clinicName = "Clínica") {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text(clinicName, width / 2, 18, { align: "center" });
  doc.setFontSize(14);
  doc.text("Receta Médica", width / 2, 26, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Fecha: ${receta.fechaEmision}`, 14, 38);
  doc.text(`Paciente: ${receta.pacienteNombre}`, 14, 44);
  doc.text(`Consulta: ${receta.consultaId.slice(0, 8)}`, 14, 50);
  doc.text(`N° Receta: ${receta.id.slice(0, 8)}`, 14, 56);

  let y = 66;
  doc.setFontSize(11);
  doc.text("Medicamentos", 14, y);
  y += 6;

  receta.items.forEach((item, idx) => {
    const line1 = `${idx + 1}. ${item.medicamento}`;
    const line2 = `Dosis: ${item.dosis} · Vía: ${item.via} · Frecuencia: ${item.frecuencia} · Duración: ${item.duracion}`;
    const line3 = item.indicacion ? `Indicación: ${item.indicacion}` : "";

    doc.setFontSize(10);
    doc.text(line1, 14, y);
    y += 5;
    doc.text(line2, 18, y);
    y += 5;
    if (line3) {
      doc.text(line3, 18, y);
      y += 5;
    }
    y += 2;

    if (y > 265) {
      doc.addPage();
      y = 20;
    }
  });

  if (receta.indicacionesGenerales) {
    y += 2;
    doc.setFontSize(11);
    doc.text("Indicaciones generales", 14, y);
    y += 6;
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(receta.indicacionesGenerales, 180);
    doc.text(wrapped, 14, y);
  }

  doc.save(`receta_${receta.id.slice(0, 8)}.pdf`);
}
