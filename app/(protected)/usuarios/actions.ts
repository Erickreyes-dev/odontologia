"use server";

import { prisma } from "@/lib/prisma";
import { EmailService, MailPayload } from "@/lib/sendEmail";
import { generateUserCreatedEmailHtml } from "@/lib/templates/createUserEmail";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { Usuario } from "./schema";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";
import { getTenantEmailBranding } from "@/lib/tenant-branding";

/**
 * Obtener todos los usuarios con rol y empleado
 */
export async function getUsuarios(): Promise<Usuario[]> {
  const records = await prisma.usuarios.findMany({
    where: await tenantWhere<Prisma.UsuariosWhereInput>(),
    include: {
      rol: { select: { id: true, nombre: true } },
      Empleados: { select: { id: true, nombre: true, apellido: true } },
    },
  });
  return records.map((r) => ({
    id: r.id,
    usuario: r.usuario,
    rol: r.rol?.nombre ?? "",
    rol_id: r.rol_id,
    empleado: r.Empleados
      ? `${r.Empleados.nombre} ${r.Empleados.apellido}`
      : "",
    empleado_id: r.empleado_id,
    activo: r.activo,
    fotoUrl: r.correo
      ? `https://www.google.com/s2/photos/profile/${encodeURIComponent(r.correo)}?sz=96`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.usuario)}&background=0ea5e9&color=ffffff`,
  }));
}

/**
 * Crear un nuevo usuario y enviar correo con contraseña temporal
 */
export async function createUsuario(data: Usuario): Promise<Usuario> {
  // 1️⃣ Generar contraseña aleatoria de 12 caracteres
  if (!data.empleado_id) {
    throw new Error("Debe seleccionar un empleado para crear usuario interno");
  }

  const tempPassword = randomBytes(9).toString("base64").slice(0, 12);

  // 2️⃣ Hashear la contraseña temporal
  const hashed = await bcrypt.hash(tempPassword, 10);

  // 3️⃣ Crear el usuario en la base de datos
  const newUser = await prisma.usuarios.create({
    data: await withTenantData({
      id: randomUUID(),
      usuario: data.usuario,
      rol_id: data.rol_id,
      empleado_id: data.empleado_id,
      contrasena: hashed,
      activo: true,
      DebeCambiarPassword: true,
    }),
  });

  // 4️⃣ Obtener datos del empleado asociado
  const empleado = await prisma.empleados.findFirst({
    where: await tenantWhere<Prisma.EmpleadosWhereInput>({ id: data.empleado_id }),
    select: { correo: true, nombre: true, apellido: true },
  });

  if (empleado?.correo) {
    // 5️⃣ Construir payload del correo usando sólo la plantilla HTML
    const { clinicLogoBase64, tenantName } = await getTenantEmailBranding();

    const html = generateUserCreatedEmailHtml(
      `${empleado.nombre} ${empleado.apellido}`,
      data.usuario,
      tempPassword,
      {
        clinicLogoBase64,
        clinicName: tenantName,
      },
    );

    const mailPayload: MailPayload = {
      to: empleado.correo,
      subject: "Cuenta creada: contraseña temporal",
      html, // Sólo HTML de la plantilla, sin texto adicional
    };

    try {
      const emailService = new EmailService();
      await emailService.sendMail(mailPayload);
    } catch (err) {
      console.error("Error enviando correo al empleado:", err);
      // Opcional: manejar reintento o registro de fallo
    }
  }

  // 6️⃣ Devolver el usuario creado (sin contraseña)
  return {
    id: newUser.id,
    usuario: newUser.usuario,
    rol: "",
    rol_id: newUser.rol_id,
    empleado: empleado
      ? `${empleado.nombre} ${empleado.apellido}`
      : "",
    empleado_id: newUser.empleado_id,
    activo: newUser.activo,
    fotoUrl: newUser.correo
      ? `https://www.google.com/s2/photos/profile/${encodeURIComponent(newUser.correo)}?sz=96`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.usuario)}&background=0ea5e9&color=ffffff`,
  };
}

/**
 * Actualizar un usuario existente
 */
export async function updateUsuario(data: Usuario): Promise<Usuario> {
  if (!data.empleado_id) {
    throw new Error("Debe seleccionar un empleado para actualizar usuario interno");
  }
  const existing = await prisma.usuarios.findFirst({ where: await tenantWhere<Prisma.UsuariosWhereInput>({ id: data.id }) });
  if (!existing) throw new Error("Usuario no encontrado en la clínica");

  const updated = await prisma.usuarios.update({
    where: { id: existing.id },
    data: {
      usuario: data.usuario,
      rol_id: data.rol_id,
      empleado_id: data.empleado_id,
      activo: data.activo,
    },
    include: {
      Empleados: { select: { nombre: true, apellido: true } },
    },
  });
  return {
    id: updated.id,
    usuario: updated.usuario,
    rol: "",
    rol_id: updated.rol_id,
    empleado: updated.Empleados
      ? `${updated.Empleados.nombre} ${updated.Empleados.apellido}`
      : "",
    empleado_id: updated.empleado_id,
    activo: updated.activo,
    fotoUrl: updated.correo
      ? `https://www.google.com/s2/photos/profile/${encodeURIComponent(updated.correo)}?sz=96`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(updated.usuario)}&background=0ea5e9&color=ffffff`,
  };
}

/**
 * Obtener usuario por ID
 */
export async function getUsuarioById(id: string): Promise<Usuario | null> {
  const r = await prisma.usuarios.findFirst({
    where: await tenantWhere<Prisma.UsuariosWhereInput>({ id }),
    include: {
      rol: { select: { nombre: true } },
      Empleados: { select: { nombre: true, apellido: true } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    usuario: r.usuario,
    rol: r.rol?.nombre ?? "",
    rol_id: r.rol_id,
    empleado: r.Empleados
      ? `${r.Empleados.nombre} ${r.Empleados.apellido}`
      : "",
    empleado_id: r.empleado_id,
    activo: r.activo,
    fotoUrl: r.correo
      ? `https://www.google.com/s2/photos/profile/${encodeURIComponent(r.correo)}?sz=96`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.usuario)}&background=0ea5e9&color=ffffff`,
  };
}
