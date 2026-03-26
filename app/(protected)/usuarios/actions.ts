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
import { getSession } from "@/auth";

type TenantQuota = {
  tenantId: string;
  maxUsuarios: number;
  activos: number;
};

async function getTenantQuotaOrThrow(tenantId: string): Promise<TenantQuota> {
  const [tenant, activeUsers] = await prisma.$transaction([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, maxUsuarios: true, activo: true },
    }),
    prisma.usuarios.count({
      where: { tenantId, activo: true },
    }),
  ]);

  if (!tenant?.activo) {
    throw new Error("La clínica no está activa para gestionar usuarios.");
  }

  return { tenantId, maxUsuarios: tenant.maxUsuarios, activos: activeUsers };
}

async function ensurePermissionOrThrow(permission: "crear_usuario" | "editar_usuario") {
  const session = await getSession();
  if (!session?.TenantId) throw new Error("Sesión inválida");
  if (!session.Permiso?.includes(permission)) {
    throw new Error("No tiene permisos para gestionar usuarios.");
  }
  return session;
}

export async function getUserQuotaStatus() {
  const session = await getSession();
  if (!session?.TenantId) return null;

  const quota = await getTenantQuotaOrThrow(session.TenantId);
  return {
    maxUsuarios: quota.maxUsuarios,
    usuariosActivos: quota.activos,
    disponibles: Math.max(0, quota.maxUsuarios - quota.activos),
    limiteAlcanzado: quota.activos >= quota.maxUsuarios,
  };
}

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
  const session = await ensurePermissionOrThrow("crear_usuario");

  // 1️⃣ Generar contraseña aleatoria de 12 caracteres
  if (!data.empleado_id) {
    throw new Error("Debe seleccionar un empleado para crear usuario interno");
  }
  const usuarioNormalizado = data.usuario.trim();
  if (usuarioNormalizado.length < 3) {
    throw new Error("El nombre de usuario debe tener al menos 3 caracteres.");
  }

  const quota = await getTenantQuotaOrThrow(session.TenantId);
  if (quota.activos >= quota.maxUsuarios) {
    throw new Error(`Límite de usuarios alcanzado para su paquete (${quota.maxUsuarios}).`);
  }

  const [rol, empleado, usuarioExistente] = await prisma.$transaction([
    prisma.rol.findFirst({
      where: { id: data.rol_id, tenantId: session.TenantId, activo: true },
      select: { id: true },
    }),
    prisma.empleados.findFirst({
      where: { id: data.empleado_id, tenantId: session.TenantId, activo: true },
      select: { id: true, correo: true, nombre: true, apellido: true },
    }),
    prisma.usuarios.findFirst({
      where: { tenantId: session.TenantId, usuario: usuarioNormalizado },
      select: { id: true },
    }),
  ]);

  if (!rol) throw new Error("El rol seleccionado no existe o no está activo.");
  if (!empleado) throw new Error("El empleado seleccionado no existe o no está activo.");
  if (usuarioExistente) throw new Error("Ya existe un usuario con ese nombre en su clínica.");

  const empleadoConUsuario = await prisma.usuarios.findFirst({
    where: { tenantId: session.TenantId, empleado_id: data.empleado_id },
    select: { id: true },
  });
  if (empleadoConUsuario) throw new Error("El empleado ya tiene un usuario asignado.");

  const tempPassword = randomBytes(9).toString("base64").slice(0, 12);

  // 2️⃣ Hashear la contraseña temporal
  const hashed = await bcrypt.hash(tempPassword, 10);

  // 3️⃣ Crear el usuario en la base de datos
  const newUser = await prisma.usuarios.create({
    data: await withTenantData({
      id: randomUUID(),
      usuario: usuarioNormalizado,
      correo: undefined,
      rol_id: data.rol_id,
      empleado_id: data.empleado_id,
      contrasena: hashed,
      activo: true,
      DebeCambiarPassword: true,
    }),
  });

  // 4️⃣ Obtener datos del empleado asociado
  if (empleado?.correo) {
    await prisma.usuarios.update({
      where: { id: newUser.id },
      data: { correo: empleado.correo },
    });

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
  const session = await ensurePermissionOrThrow("editar_usuario");

  if (!data.empleado_id) {
    throw new Error("Debe seleccionar un empleado para actualizar usuario interno");
  }
  const usuarioNormalizado = data.usuario.trim();
  if (usuarioNormalizado.length < 3) {
    throw new Error("El nombre de usuario debe tener al menos 3 caracteres.");
  }

  const existing = await prisma.usuarios.findFirst({ where: await tenantWhere<Prisma.UsuariosWhereInput>({ id: data.id }) });
  if (!existing) throw new Error("Usuario no encontrado en la clínica");

  if (!existing.activo && data.activo) {
    const quota = await getTenantQuotaOrThrow(session.TenantId);
    if (quota.activos >= quota.maxUsuarios) {
      throw new Error(`No puede activar más usuarios. Límite de paquete: ${quota.maxUsuarios}.`);
    }
  }

  const duplicate = await prisma.usuarios.findFirst({
    where: {
      tenantId: session.TenantId,
      usuario: usuarioNormalizado,
      NOT: { id: existing.id },
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new Error("Ya existe otro usuario con ese nombre en su clínica.");
  }

  const [rol, empleado] = await prisma.$transaction([
    prisma.rol.findFirst({
      where: { id: data.rol_id, tenantId: session.TenantId, activo: true },
      select: { id: true },
    }),
    prisma.empleados.findFirst({
      where: { id: data.empleado_id, tenantId: session.TenantId, activo: true },
      select: { id: true, correo: true },
    }),
  ]);
  if (!rol) throw new Error("El rol seleccionado no existe o no está activo.");
  if (!empleado) throw new Error("El empleado seleccionado no existe o no está activo.");

  const empleadoYaAsignado = await prisma.usuarios.findFirst({
    where: {
      tenantId: session.TenantId,
      empleado_id: data.empleado_id,
      NOT: { id: existing.id },
    },
    select: { id: true },
  });
  if (empleadoYaAsignado) {
    throw new Error("El empleado ya tiene otro usuario asignado.");
  }

  const updated = await prisma.usuarios.update({
    where: { id: existing.id },
    data: {
      usuario: usuarioNormalizado,
      correo: data.empleado_id
        ? (
          await prisma.empleados.findFirst({
            where: await tenantWhere<Prisma.EmpleadosWhereInput>({ id: data.empleado_id }),
            select: { correo: true },
          })
        )?.correo ?? existing.correo
        : existing.correo,
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
