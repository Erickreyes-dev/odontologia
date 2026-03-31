export function generateRootTenantRegistrationNotificationHtml(params: {
  consultorioNombre: string;
  tenantSlug: string;
  contactoNombre: string;
  contactoCorreo: string;
  planNombre: string;
  teamSize: string;
  paisCodigo: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Nuevo tenant registrado</h2>
      <p>Se registró una nueva clínica en la plataforma.</p>
      <ul>
        <li><strong>Clínica:</strong> ${params.consultorioNombre}</li>
        <li><strong>Slug:</strong> ${params.tenantSlug}</li>
        <li><strong>Contacto:</strong> ${params.contactoNombre}</li>
        <li><strong>Correo:</strong> ${params.contactoCorreo}</li>
        <li><strong>Plan:</strong> ${params.planNombre}</li>
        <li><strong>Tamaño equipo:</strong> ${params.teamSize}</li>
        <li><strong>País:</strong> ${params.paisCodigo}</li>
      </ul>
    </div>
  `;
}
