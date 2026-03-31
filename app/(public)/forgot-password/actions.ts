"use server";

import { prisma } from "@/lib/prisma";
import { EmailService, MailPayload } from "@/lib/sendEmail";
import { generatePasswordResetEmailHtml } from "@/lib/templates/forgoutPassword";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { addHours, isAfter } from "date-fns";
import { headers } from "next/headers";
import { normalizeLogoDataUri } from "@/lib/tenant-branding";

const RESET_TOKEN_TTL_HOURS = 2; // Token válido por 2 horas

function resolveCurrentOriginFromRequest() {
    const headerList = headers();
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
    const proto = headerList.get("x-forwarded-proto") ?? "http";

    if (host) {
        return `${proto}://${host}`;
    }

    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}



export async function isResetTokenValid(token: string): Promise<boolean> {
    if (!token) return false;

    const record = await prisma.passwordResetToken.findUnique({
        where: { token },
    });

    if (!record || isAfter(new Date(), record.expiresAt)) {
        return false;
    }

    return true;
}



/**
 * Solicita restablecer contraseña: genera un token, lo guarda y envía
 * un correo al empleado asociado al usuario.
 */
export async function requestPasswordReset(username: string): Promise<boolean> {
    const lookup = username.trim().toLowerCase();
    // 1️⃣ Buscar usuario por usuario o correo
    const user = await prisma.usuarios.findFirst({
        where: {
            OR: [
                { usuario: username.trim() },
                { correo: lookup },
                { Empleados: { correo: lookup } },
            ],
        },
        include: {
            Empleados: {
                select: { correo: true, nombre: true, apellido: true },
            },
            tenant: {
                select: { nombre: true, logoBase64: true },
            },
        },
    });
    const destinationEmail = user?.Empleados?.correo || user?.correo;
    // Si no existe usuario o no hay correo, no divulgamos la razón
    if (!user || !destinationEmail) {
        return false;
    }

    // 2️⃣ Generar token y fecha de expiración
    const token = randomUUID() + randomBytes(16).toString("hex");
    const expiresAt = addHours(new Date(), RESET_TOKEN_TTL_HOURS);

    // 3️⃣ Eliminar tokens previos y crear uno nuevo
    await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
    });
    await prisma.passwordResetToken.create({
        data: {
            id: randomUUID(),
            userId: user.id,
            token,
            expiresAt,
        },
    });

    // 4️⃣ Construir enlace de restablecimiento
    const baseUrl = resolveCurrentOriginFromRequest();
    const link = `${baseUrl}/forgot-password?token=${encodeURIComponent(token)}`;

    // 5️⃣ Preparar correo usando la plantilla
    const fullName = user.Empleados
        ? `${user.Empleados.nombre} ${user.Empleados.apellido}`
        : user.usuario;
    const html = generatePasswordResetEmailHtml(fullName, link, {
        clinicLogoBase64: normalizeLogoDataUri(user.tenant?.logoBase64 ?? null),
        clinicName: user.tenant?.nombre ?? null,
    });
    const mailPayload: MailPayload = {
        to: destinationEmail,
        subject: "Restablecer contraseña",
        html,
    };
    console.log("Enviando correo de restablecimiento a:", mailPayload.to);
    // 6️⃣ Enviar correo
    try {
        const emailService = new EmailService();
        await emailService.sendMail(mailPayload);
        console.log("Correo de restablecimiento enviado exitosamente a:", mailPayload.to);
        return true;
    } catch (err) {
        console.error("Error enviando correo de restablecimiento:", err);
        return false;
    }
}

/**
 * Restablece la contraseña: valida token y asigna nueva contraseña.
 */
export async function resetPassword(
    token: string,
    newPassword: string
): Promise<boolean> {
    // 1️⃣ Buscar el registro de token
    const record = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { Usuario: true },
    });
    if (!record) return false;

    // 2️⃣ Validar expiración
    if (isAfter(new Date(), record.expiresAt)) {
        await prisma.passwordResetToken.delete({ where: { id: record.id } });
        return false;
    }

    // 3️⃣ Hashear y actualizar la contraseña del usuario
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.usuarios.update({
        where: { id: record.userId },
        data: {
            contrasena: hashed,
            DebeCambiarPassword: false,
        },
    });

    // 4️⃣ Eliminar token consumido
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return true;
}
