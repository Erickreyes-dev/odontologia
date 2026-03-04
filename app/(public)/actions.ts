// app/actions/auth.ts

"use server";

import { EmailService } from "@/lib/sendEmail";
import { requestPasswordReset } from "./forgot-password/actions";

export interface RequestAccessFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function forgotPasswordAction(formData: FormData) {
  const username = formData.get("username");
  if (typeof username !== "string" || !username.trim() || username.length < 3) {
    // Si el usuario está vacío, redirigimos de vuelta a login con un flag de error
    return false;
  }

  // Llamamos a la lógica que genera el token y envía el email
  await requestPasswordReset(username.trim());

  // Redirigimos al login con un mensaje de “correo enviado”
  return true;
}

export async function requestAccessAction(_: RequestAccessFormState, formData: FormData): Promise<RequestAccessFormState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");

  if (typeof name !== "string" || typeof email !== "string" || typeof phone !== "string") {
    return {
      status: "error",
      message: "Datos inválidos. Intenta nuevamente.",
    };
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanPhone = phone.trim();

  if (cleanName.length < 3 || cleanPhone.length < 7 || !cleanEmail.includes("@")) {
    return {
      status: "error",
      message: "Completa nombre, correo y teléfono correctamente.",
    };
  }

  try {
    const emailService = new EmailService();

    await emailService.sendMail({
      to: "erickjosepineda33@gmail.com",
      subject: "Nueva solicitud de acceso desde landing page",
      text: `Nombre: ${cleanName}\nCorreo: ${cleanEmail}\nTeléfono: ${cleanPhone}`,
      html: `
        <h2>Nueva solicitud de acceso</h2>
        <p><strong>Nombre:</strong> ${cleanName}</p>
        <p><strong>Correo:</strong> ${cleanEmail}</p>
        <p><strong>Teléfono:</strong> ${cleanPhone}</p>
      `,
    });

    return {
      status: "success",
      message: "¡Gracias! Tu solicitud fue enviada correctamente.",
    };
  } catch (error) {
    console.error("Error enviando solicitud de acceso:", error);

    return {
      status: "error",
      message: "No se pudo enviar la solicitud en este momento. Intenta más tarde.",
    };
  }
}
