export function generateRegistrationVerificationEmailHtml(email: string, verificationLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #0f172a;">Verifica tu correo para crear tu clínica</h2>
      <p>Hola,</p>
      <p>Recibimos una solicitud de registro para <strong>${email}</strong>.</p>
      <p>Para continuar y crear tu clínica con contraseña, confirma tu correo en el siguiente enlace:</p>
      <p style="margin: 24px 0;">
        <a href="${verificationLink}" style="background: #06b6d4; color: #082f49; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">
          Verificar correo
        </a>
      </p>
      <p>Este enlace expira en 2 horas.</p>
      <p>Si no realizaste esta solicitud, puedes ignorar este mensaje.</p>
    </div>
  `;
}
