// prisma/seed.ts
import "dotenv/config"; // 🔹 Esto carga el .env automáticamente
import { PrismaClient } from "@/lib/generated/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // 1. Opcional: resetear datos
  const resetData = process.env.RESET_SEED === "true";
  if (resetData) {
    await prisma.rolPermiso.deleteMany();
    await prisma.usuarios.deleteMany();
    await prisma.empleados.deleteMany();
    await prisma.puesto.deleteMany();
    await prisma.rol.deleteMany();
    await prisma.permiso.deleteMany();
    console.log("Datos anteriores eliminados");
  }

  // 2. Sembrar Permisos
  const permisosData = [
    { nombre: "ver_empleados", descripcion: "Permiso para ver los empleados" },
    { nombre: "crear_empleados", descripcion: "Permiso para crear los empleados" },
    { nombre: "editar_empleado", descripcion: "Permiso para editar los empleados" },
    { nombre: "ver_permisos", descripcion: "Permiso para ver los permisos" },
    { nombre: "ver_roles", descripcion: "Permiso para ver roles" },
    { nombre: "crear_roles", descripcion: "Permiso para crear roles" },
    { nombre: "editar_roles", descripcion: "Permiso para editar roles" },
    { nombre: "ver_usuarios", descripcion: "Permiso para ver usuarios" },
    { nombre: "crear_usuario", descripcion: "Permiso para crear usuarios" },
    { nombre: "editar_usuario", descripcion: "Permiso para editar usuarios" },
    { nombre: "ver_puestos", descripcion: "Permiso para ver puestos" },
    { nombre: "crear_puestos", descripcion: "Permiso para crear puestos" },
    { nombre: "editar_puestos", descripcion: "Permiso para editar puestos" },
    { nombre: "ver_profile", descripcion: "Permiso para ver el perfil" },
  ];

  const permisoIds: string[] = [];
  for (const p of permisosData) {
    let permiso = await prisma.permiso.findUnique({ where: { nombre: p.nombre } });
    if (!permiso) {
      permiso = await prisma.permiso.create({
        data: {
          id: randomUUID(),
          nombre: p.nombre,
          descripcion: p.descripcion,
          activo: true,
        },
      });
      console.log(`Permiso creado: ${p.nombre}`);
    } else {
      console.log(`Permiso existente: ${p.nombre}`);
    }
    permisoIds.push(permiso.id);
  }

  // 3. Crear rol Administrador
  let adminRole = await prisma.rol.findUnique({ where: { nombre: "Administrador" } });
  if (!adminRole) {
    adminRole = await prisma.rol.create({
      data: {
        id: randomUUID(),
        nombre: "Administrador",
        descripcion: "Rol con acceso total al sistema",
        activo: true,
      },
    });
    console.log("Rol Administrador creado");
  } else {
    console.log("Rol Administrador existente");
  }

  // 4. Asignar permisos al rol
  const existingRolePermisos = await prisma.rolPermiso.findMany({ where: { rolId: adminRole.id } });
  const existingIds = new Set(existingRolePermisos.map((rp) => rp.permisoId));
  for (const pid of permisoIds) {
    if (!existingIds.has(pid)) {
      await prisma.rolPermiso.create({ data: { rolId: adminRole.id, permisoId: pid } });
    }
  }
  console.log("Permisos asignados a Administrador");

  // 5. Crear Puesto
  let puesto = await prisma.puesto.findFirst({ where: { Nombre: "Desarrollador SR" } });
  if (!puesto) {
    puesto = await prisma.puesto.create({
      data: {
        Id: randomUUID(),
        Nombre: "Desarrollador SR",
        Descripcion: "Desarrollador SR de software",
        Activo: true,
      },
    });
    console.log("Puesto creado");
  }

  // 6. Crear Empleado
  let empleado = await prisma.empleados.findFirst({ where: { correo: "erickjosepineda33@gmail.com" } });
  if (!empleado) {
    empleado = await prisma.empleados.create({
      data: {
        id: randomUUID(),
        nombre: "Erick",
        apellido: "Reyes",
        puesto_id: puesto.Id,
        correo: "erickjosepineda33@gmail.com",
        FechaNacimiento: new Date(1999, 11, 2),
        fechaIngreso: new Date(2023, 0, 1),
        telefono: "9999-9999",
        identidad: "0801-1999-00001",
        Vacaciones: 10,
        genero: "Masculino",
        activo: true,
      },
    });
    console.log("Empleado creado: " + empleado.nombre);
  }

  // 7. Crear Usuario
  let usuario = await prisma.usuarios.findFirst({ where: { usuario: "erick.reyes" } });
  if (!usuario) {
    usuario = await prisma.usuarios.create({
      data: {
        id: randomUUID(),
        usuario: "erick.reyes",
        contrasena: await bcrypt.hash("erick.reyes", 10),
        empleado_id: empleado.id,
        rol_id: adminRole.id,
        activo: true,
        DebeCambiarPassword: false,
      },
    });
    console.log("Usuario creado: " + usuario.usuario);
  }

  console.log("Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
