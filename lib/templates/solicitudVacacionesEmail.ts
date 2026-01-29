// emailTemplates.ts

export interface SolicitudData {
  empleadoNombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  descripcion: string;
  tipoSolicitud?: string;
}
export function solicitudCreadaTemplate(data: SolicitudData): string {
  const { empleadoNombre, fechaInicio, fechaFin, descripcion } = data;
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height:1.6;">
        <p>Hola ${empleadoNombre},</p>
        <p>Tu solicitud de vacaciones ha sido registrada con éxito:</p>
        <ul>
          <li><strong>Empleado:</strong> ${empleadoNombre}</li>
          <li><strong>Tipo:</strong> ${data.tipoSolicitud ?? 'Vacación'}</li>
          <li><strong>Periodo:</strong> ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}</li>
          <li><strong>Descripción:</strong> ${descripcion}</li>
        </ul>
        <p>Recibirás notificaciones cuando tu solicitud sea aprobada o rechazada.</p>
        <p>Saludos,<br/>Equipo de Recursos Humanos</p>
      </body>
    </html>
  `;
}

export function solicitudParaAprobadorTemplate(data: SolicitudData & { nivel: number; linkRevisar: string }): string {
  const { empleadoNombre, fechaInicio, fechaFin, descripcion, nivel, linkRevisar } = data;
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height:1.6;">
        <p>Estimado/a aprobador (Nivel ${nivel}),</p>
        <p>Se ha generado una nueva solicitud de vacaciones que requiere tu revisión:</p>
        <ul>
          <li><strong>Empleado:</strong> ${empleadoNombre}</li>
          <li><strong>Tipo:</strong> ${data.tipoSolicitud ?? 'Vacación'}</li>
          <li><strong>Periodo:</strong> ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}</li>
          <li><strong>Descripción:</strong> ${descripcion}</li>
        </ul>
        <p>Por favor <a href="${linkRevisar}">haz clic aquí</a> para revisar y aprobar o rechazar la solicitud.</p>
        <p>Saludos,<br/>Sistema de Autogestión de Empleados</p>
      </body>
    </html>
  `;
}
