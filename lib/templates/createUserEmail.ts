// templates/userCreatedEmail.ts

type BrandingOptions = {
  clinicLogoBase64?: string | null;
  clinicName?: string | null;
};

function emailLayout(title: string, subtitle: string, content: string, branding?: BrandingOptions): string {
  const clinicName = branding?.clinicName?.trim() || "Clínica";
  const logo = branding?.clinicLogoBase64 || "";

  return `
  <div style="font-family: Inter, Arial, sans-serif; background:#f3f7fb; padding:28px; color:#0f172a;">
    <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #dbeafe; border-radius:16px; overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0f172a,#0f766e); padding:28px; color:#fff;">
        <div style="display:flex; align-items:center; gap:10px;">
          ${logo ? `<img src="${logo}" alt="Logo clínica" style="width:64px; height:64px; border-radius:12px; object-fit:contain; background:#fff; padding:4px;" />` : ""}
          <p style="margin:0; font-size:12px; letter-spacing:.12em; text-transform:uppercase; opacity:.85;">${clinicName}</p>
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

export function generateUserCreatedEmailHtml(
  fullName: string,
  username: string,
  tempPassword: string,
  branding?: BrandingOptions,
): string {
  return emailLayout(
    "Cuenta creada exitosamente",
    "Acceso inicial a la plataforma",
    `
      <p>Hola <strong>${fullName}</strong>,</p>
      <p>Tu cuenta fue creada correctamente. Te compartimos tus credenciales temporales:</p>
      <table style="margin: 20px 0; border-collapse: collapse; width: 100%; max-width: 460px; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; background: #f8fafc; width:45%;">Usuario</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${username}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: 600; background: #f8fafc;">Contraseña temporal</td>
          <td style="padding: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#f1f5f9;">${tempPassword}</td>
        </tr>
      </table>
      <p>Por seguridad, cambia tu contraseña en tu primer ingreso.</p>
      <p style="margin-top:18px;">Saludos,<br/><strong>Equipo administrativo</strong></p>
    `,
    branding,
  );
}
