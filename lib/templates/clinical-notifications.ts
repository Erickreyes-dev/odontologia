import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const HONDURAS_TIMEZONE = "America/Tegucigalpa";

function layout(title: string, subtitle: string, content: string, clinicLogoBase64?: string | null) {
  return `
  <div style="font-family: Inter, Arial, sans-serif; background:#f3f7fb; padding:28px; color:#0f172a;">
    <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #dbeafe; border-radius:16px; overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0f172a,#0f766e); padding:28px; color:#fff;">
        <div style="display:flex; align-items:center; gap:10px;">
          ${clinicLogoBase64 ? `<img src="${clinicLogoBase64}" alt="Logo clínica" style="width:36px; height:36px; border-radius:8px; object-fit:cover; background:#fff;" />` : ""}
          <p style="margin:0; font-size:12px; letter-spacing:.12em; text-transform:uppercase; opacity:.85;">MedisoftCore</p>
        </div>
        <h2 style="margin:8px 0 4px; font-size:24px;">${title}</h2>
        <p style="margin:0; font-size:14px; opacity:.9;">${subtitle}</p>
      </div>
      <div style="padding:24px 28px; line-height:1.6; font-size:14px;">
        ${content}
      </div>
      <div style="padding:18px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; color:#475569; font-size:12px;">
        Este mensaje fue generado automáticamente por MedisoftCore.
      </div>
    </div>
  </div>`;
}

export function generateAppointmentEmailHtml(params: {
  clinicLogoBase64?: string | null;
  pacienteNombre: string;
  medicoNombre: string;
  consultorioNombre: string;
  fechaHora: Date;
  motivo?: string | null;
  observacion?: string | null;
}) {
  const fecha = formatInTimeZone(
    params.fechaHora,
    HONDURAS_TIMEZONE,
    "EEEE d 'de' MMMM 'de' yyyy, hh:mm a",
    { locale: es }
  );

  return layout(
    "Confirmación de cita",
    `Dr(a). ${params.medicoNombre}`,
    `<p>Estimado(a) <strong>${params.pacienteNombre}</strong>,</p>
     <p>Se ha programado una cita en la clínica con los siguientes detalles:</p>
     <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <tr><td style="padding:8px 0; color:#334155;"><strong>Fecha y hora:</strong></td><td>${fecha} (UTC-6)</td></tr>
      <tr><td style="padding:8px 0; color:#334155;"><strong>Médico:</strong></td><td>Dr(a). ${params.medicoNombre}</td></tr>
      <tr><td style="padding:8px 0; color:#334155;"><strong>Consultorio:</strong></td><td>${params.consultorioNombre}</td></tr>
      <tr><td style="padding:8px 0; color:#334155;"><strong>Motivo:</strong></td><td>${params.motivo || "Consulta general"}</td></tr>
     </table>
     ${params.observacion ? `<p><strong>Observaciones:</strong> ${params.observacion}</p>` : ""}
     <p>Le recomendamos llegar 10 minutos antes de su cita.</p>
     <p>Atentamente,<br/>Dr(a). ${params.medicoNombre}</p>`
  , params.clinicLogoBase64);
}

export function generateCotizacionEmailHtml(params: {
  clinicLogoBase64?: string | null;
  pacienteNombre: string;
  medicoNombre: string;
  fecha: Date;
  total: number;
  estado: string;
  servicios: string[];
}) {
  return layout(
    "Cotización de tratamiento dental",
    `Documento compartido por Dr(a). ${params.medicoNombre}`,
    `<p>Estimado(a) <strong>${params.pacienteNombre}</strong>,</p>
     <p>Hemos preparado su cotización con un enfoque clínico y financiero transparente.</p>
     <p><strong>Fecha:</strong> ${formatInTimeZone(params.fecha, HONDURAS_TIMEZONE, "dd/MM/yyyy", { locale: es })}<br/>
     <strong>Estado:</strong> ${params.estado}<br/>
     <strong>Total estimado:</strong> L. ${params.total.toLocaleString("es-HN", { minimumFractionDigits: 2 })}</p>
     <p><strong>Servicios considerados:</strong></p>
     <ul>${params.servicios.map((s) => `<li>${s}</li>`).join("")}</ul>
     <p>Para continuar, puede responder este correo o comunicarse con recepción.</p>
     <p>Atentamente,<br/>Dr(a). ${params.medicoNombre}</p>`
  , params.clinicLogoBase64);
}

export function generatePlanEmailHtml(params: {
  clinicLogoBase64?: string | null;
  pacienteNombre: string;
  medicoNombre: string;
  planNombre: string;
  fechaInicio: Date;
  estado: string;
  etapas: string[];
}) {
  return layout(
    "Plan de trabajo / tratamiento",
    `Plan clínico diseñado por Dr(a). ${params.medicoNombre}`,
    `<p>Estimado(a) <strong>${params.pacienteNombre}</strong>,</p>
     <p>Le compartimos su plan de tratamiento para acompañar su proceso de manera ordenada y profesional.</p>
     <p><strong>Plan:</strong> ${params.planNombre}<br/>
     <strong>Fecha de inicio:</strong> ${formatInTimeZone(params.fechaInicio, HONDURAS_TIMEZONE, "dd/MM/yyyy", { locale: es })}<br/>
     <strong>Estado:</strong> ${params.estado}</p>
     <p><strong>Etapas consideradas:</strong></p>
     <ol>${params.etapas.map((e) => `<li>${e}</li>`).join("")}</ol>
     <p>Si necesita ajustes en fechas o alcance, nuestro equipo puede apoyarle.</p>
     <p>Atentamente,<br/>Dr(a). ${params.medicoNombre}</p>`
  , params.clinicLogoBase64);
}

export function generatePagoEmailHtml(params: {
  clinicLogoBase64?: string | null;
  pacienteNombre: string;
  medicoNombre: string;
  fechaPago: Date;
  monto: number;
  metodo: string;
  referencia?: string | null;
}) {
  return layout(
    "Confirmación de pago",
    `Pago registrado por Dr(a). ${params.medicoNombre}`,
    `<p>Estimado(a) <strong>${params.pacienteNombre}</strong>,</p>
     <p>Le confirmamos que su pago ha sido registrado exitosamente en la clínica.</p>
     <p><strong>Fecha:</strong> ${formatInTimeZone(params.fechaPago, HONDURAS_TIMEZONE, "dd/MM/yyyy hh:mm a", { locale: es })} (UTC-6)<br/>
     <strong>Método de pago:</strong> ${params.metodo}<br/>
     <strong>Monto:</strong> L. ${params.monto.toLocaleString("es-HN", { minimumFractionDigits: 2 })}<br/>
     <strong>Referencia:</strong> ${params.referencia || "N/A"}</p>
     <p>Gracias por su confianza.</p>
     <p>Atentamente,<br/>Dr(a). ${params.medicoNombre}</p>`
  , params.clinicLogoBase64);
}
