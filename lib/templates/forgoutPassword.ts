// templates/passwordResetEmail.ts
export function generatePasswordResetEmailHtml(
  fullName: string,
  resetLink: string
): string {
  return `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #D9534F;">Restablecer tu contraseña</h2>
    <p>Hola <strong>${fullName}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón a continuación para definir una nueva contraseña:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a
        href="${resetLink}"
        style="
          background-color: #D9534F;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
        "
      >
        Restablecer Contraseña
      </a>
    </p>
    <p>Si no solicitaste este cambio, puedes ignorar este correo. El enlace expirará en ${2} horas.</p>
    <p>Saludos,<br><em>El equipo de soporte</em></p>
  </div>
  `;
}
