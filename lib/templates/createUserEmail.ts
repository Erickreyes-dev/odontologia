// templates/userCreatedEmail.ts
export function generateUserCreatedEmailHtml(
  fullName: string,
  username: string,
  tempPassword: string
): string {
  return `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #4A90E2;">¡Bienvenido al Sistema!</h2>
    <p>Hola <strong>${fullName}</strong>,</p>
    <p>Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales temporales:</p>
    <table style="margin: 20px 0; border-collapse: collapse; width: 100%; max-width: 400px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f0f0f0;">Usuario:</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${username}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f0f0f0;">Contraseña Temporal:</td>
        <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-family: monospace;">${tempPassword}</td>
      </tr>
    </table>
    <p style="margin-top: 20px;">Por favor, ingresa al sistema y cambia tu contraseña lo antes posible.</p>
      <p>
    Puedes acceder al sistema en el siguiente enlace:<br>
    <a href="https://autogestion-alpha.vercel.app/" style="color: #4A90E2; font-weight: bold; text-decoration: none;">
      https://autogestion-alpha.vercel.app/
    </a>
  </p>
    <p>Saludos,<br><em>El equipo de soporte</em></p>
  </div>
  `;
}
