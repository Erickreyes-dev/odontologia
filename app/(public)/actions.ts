// app/actions/auth.ts

"use server";

import { EmailService } from "@/lib/sendEmail";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { requestPasswordReset } from "./forgot-password/actions";

export interface RequestAccessFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export interface TenantAppointmentFormState {
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

export async function requestTenantAppointmentAction(
  _: TenantAppointmentFormState,
  formData: FormData,
): Promise<TenantAppointmentFormState> {
  const tenantSlug = headers().get("x-tenant-slug");
  if (!tenantSlug) {
    return {
      status: "error",
      message: "No se pudo identificar la clínica. Recarga e inténtalo de nuevo.",
    };
  }

  const nombre = formData.get("name");
  const email = formData.get("email");
  const telefono = formData.get("phone");
  const motivo = formData.get("reason");
  const appointmentDate = formData.get("appointmentDate");

  if (
    typeof nombre !== "string" ||
    typeof email !== "string" ||
    typeof telefono !== "string" ||
    typeof motivo !== "string" ||
    typeof appointmentDate !== "string"
  ) {
    return {
      status: "error",
      message: "Datos inválidos. Verifica el formulario e inténtalo nuevamente.",
    };
  }

  const cleanNombre = nombre.trim();
  const cleanEmail = email.trim();
  const cleanTelefono = telefono.trim();
  const cleanMotivo = motivo.trim();
  const selectedDate = new Date(`${appointmentDate}T00:00:00`);

  if (
    cleanNombre.length < 3 ||
    cleanTelefono.length < 7 ||
    cleanMotivo.length < 5 ||
    !cleanEmail.includes("@") ||
    Number.isNaN(selectedDate.getTime())
  ) {
    return {
      status: "error",
      message: "Completa correctamente nombre, correo, teléfono, motivo y fecha.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return {
      status: "error",
      message: "Selecciona una fecha válida (hoy o futura).",
    };
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        nombre: true,
        contactoCorreo: true,
      },
    });

    if (!tenant) {
      return {
        status: "error",
        message: "No se encontró la clínica para esta solicitud.",
      };
    }

    await prisma.solicitudCitaPublica.create({
      data: {
        tenantId: tenant.id,
        nombrePaciente: cleanNombre,
        correoPaciente: cleanEmail,
        telefonoPaciente: cleanTelefono,
        motivo: cleanMotivo,
        fechaSolicitada: selectedDate,
      },
    });

    if (!tenant.contactoCorreo) {
      return {
        status: "success",
        message: "Tu cita fue solicitada correctamente. La clínica te contactará pronto.",
      };
    }

    const formattedDate = selectedDate.toLocaleDateString("es-HN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailService = new EmailService();

    try {
      await emailService.sendMail({
        to: tenant.contactoCorreo,
        subject: `Nueva solicitud de cita - ${tenant.nombre}`,
        text: `Se registró una nueva solicitud de cita.

Fecha solicitada: ${formattedDate}
Nombre: ${cleanNombre}
Correo: ${cleanEmail}
Teléfono: ${cleanTelefono}
Motivo: ${cleanMotivo}`,
        html: `
          <h2>Nueva solicitud de cita</h2>
          <p>Se registró una nueva solicitud de cita desde el landing del tenant.</p>
          <ul>
            <li><strong>Fecha solicitada:</strong> ${formattedDate}</li>
            <li><strong>Nombre:</strong> ${cleanNombre}</li>
            <li><strong>Correo:</strong> ${cleanEmail}</li>
            <li><strong>Teléfono:</strong> ${cleanTelefono}</li>
            <li><strong>Motivo:</strong> ${cleanMotivo}</li>
          </ul>
        `,
      });
    } catch (mailError) {
      console.error("Error enviando correo de solicitud de cita:", mailError);

      return {
        status: "success",
        message:
          "Tu cita fue solicitada correctamente. Ya la registramos y la clínica te contactará pronto.",
      };
    }

    return {
      status: "success",
      message: "Tu cita fue solicitada correctamente. La clínica te contactará pronto.",
    };
  } catch (error) {
    console.error("Error creando solicitud de cita pública:", error);

    return {
      status: "error",
      message: "No se pudo registrar la cita en este momento. Intenta más tarde.",
    };
  }
}
