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
    await prisma.medico.deleteMany();
    await prisma.profesion.deleteMany();
    await prisma.tenant.deleteMany();
    console.log("Datos anteriores eliminados");
  }

  // 2. Crear tenant base (clínica)
  let tenant = await prisma.tenant.findUnique({ where: { slug: "demo-clinica" } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: randomUUID(),
        nombre: "Clínica Demo",
        slug: "demo-clinica",
        activo: true,
        plan: "starter",
        maxUsuarios: 20,
      },
    });
    console.log("Tenant demo creado");
  }


  let platformTenant = await prisma.tenant.findUnique({ where: { slug: "platform" } });
  if (!platformTenant) {
    platformTenant = await prisma.tenant.create({
      data: {
        id: randomUUID(),
        nombre: "Plataforma SaaS",
        slug: "platform",
        activo: true,
        plan: "enterprise",
        maxUsuarios: 1000,
      },
    });
    console.log("Tenant platform creado");
  }

  // 3. Sembrar Permisos
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
    
    // permisos seguro
    
    { nombre: "ver_seguros", descripcion: "Permiso para ver seguros" },
    { nombre: "crear_seguros", descripcion: "Permiso para crear seguros" },
    { nombre: "editar_seguros", descripcion: "Permiso para editar seguros" },

    // permisos paciente
    { nombre: "ver_pacientes", descripcion: "Permiso para ver pacientes" },
    { nombre: "crear_pacientes", descripcion: "Permiso para crear pacientes" },
    { nombre: "editar_pacientes", descripcion: "Permiso para editar pacientes" },

  // permisos profesiones
    { nombre: "ver_profesiones", descripcion: "Permiso para ver profesiones" },
    { nombre: "crear_profesiones", descripcion: "Permiso para crear profesiones" },
    { nombre: "editar_profesiones", descripcion: "Permiso para editar profesiones" },

    // permisos medicos
    { nombre: "ver_medicos", descripcion: "Permiso para ver medicos" },
    { nombre: "crear_medicos", descripcion: "Permiso para crear medicos" },
    { nombre: "editar_medicos", descripcion: "Permiso para editar medicos" },

    // permisos servicios
    { nombre: "ver_servicios", descripcion: "Permiso para ver servicios" },
    { nombre: "crear_servicios", descripcion: "Permiso para crear servicios" },
    { nombre: "editar_servicios", descripcion: "Permiso para editar servicios" },

    // permisos consultorios
    { nombre: "ver_consultorios", descripcion: "Permiso para ver consultorios" },
    { nombre: "crear_consultorios", descripcion: "Permiso para crear consultorios" },
    { nombre: "editar_consultorios", descripcion: "Permiso para editar consultorios" },

    // permisos citas
    { nombre: "ver_citas", descripcion: "Permiso para ver citas" },
    { nombre: "crear_citas", descripcion: "Permiso para crear citas" },
    { nombre: "editar_citas", descripcion: "Permiso para editar citas" },

    // permisos cotizaciones
    { nombre: "ver_cotizaciones", descripcion: "Permiso para ver cotizaciones" },
    { nombre: "crear_cotizaciones", descripcion: "Permiso para crear cotizaciones" },
    { nombre: "editar_cotizaciones", descripcion: "Permiso para editar cotizaciones" },

    // permisos planes de tratamiento
    { nombre: "ver_planes_tratamiento", descripcion: "Permiso para ver planes de tratamiento" },
    { nombre: "crear_planes_tratamiento", descripcion: "Permiso para crear planes de tratamiento" },
    { nombre: "editar_planes_tratamiento", descripcion: "Permiso para editar planes de tratamiento" },

    // permisos pagos
    { nombre: "ver_pagos", descripcion: "Permiso para ver pagos y financiamientos" },
    { nombre: "crear_pagos", descripcion: "Permiso para registrar pagos" },
    { nombre: "crear_financiamiento", descripcion: "Permiso para crear financiamientos" },

    // permisos inventario
    { nombre: "ver_inventario", descripcion: "Permiso para ver inventario de productos" },
    { nombre: "crear_inventario", descripcion: "Permiso para ver crear inventario" },
    { nombre: "editar_inventario", descripcion: "Permiso para ver editar inventario" },

    // admin saas
    { nombre: "ver_dashboard_admin", descripcion: "Permiso para ver dashboard global de tenants" },
    { nombre: "gestionar_tenants", descripcion: "Permiso para crear y gestionar tenants" },

  ];

  const permisoIds: string[] = [];
  for (const p of permisosData) {
    let permiso = await prisma.permiso.findFirst({ where: { nombre: p.nombre, tenantId: tenant.id } });
    if (!permiso) {
      permiso = await prisma.permiso.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
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

  // 4. Crear rol Administrador
  let adminRole = await prisma.rol.findFirst({ where: { nombre: "Administrador", tenantId: tenant.id } });
  if (!adminRole) {
    adminRole = await prisma.rol.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        nombre: "Administrador",
        descripcion: "Rol con acceso total al sistema",
        activo: true,
      },
    });
    console.log("Rol Administrador creado");
  } else {
    console.log("Rol Administrador existente");
  }

  // 5. Asignar permisos al rol
  const existingRolePermisos = await prisma.rolPermiso.findMany({ where: { rolId: adminRole.id } });
  const existingIds = new Set(existingRolePermisos.map((rp) => rp.permisoId));
  for (const pid of permisoIds) {
    if (!existingIds.has(pid)) {
      await prisma.rolPermiso.create({ data: { rolId: adminRole.id, permisoId: pid } });
    }
  }
  console.log("Permisos asignados a Administrador");

  // 6. Crear Puesto
  let puesto = await prisma.puesto.findFirst({ where: { Nombre: "Desarrollador SR", tenantId: tenant.id } });
  if (!puesto) {
    puesto = await prisma.puesto.create({
      data: {
        Id: randomUUID(),
        tenantId: tenant.id,
        Nombre: "Desarrollador SR",
        Descripcion: "Desarrollador SR de software",
        Activo: true,
      },
    });
    console.log("Puesto creado");
  }

  // 7. Crear Empleado
  let empleado = await prisma.empleados.findFirst({ where: { correo: "erickjosepineda33@gmail.com", tenantId: tenant.id } });
  if (!empleado) {
    empleado = await prisma.empleados.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
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

  // 8. Crear Usuario
  let usuario = await prisma.usuarios.findFirst({ where: { usuario: "erick.reyes", tenantId: tenant.id } });
  if (!usuario) {
    usuario = await prisma.usuarios.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
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
  // 9. Crear Profesion
let profesion = await prisma.profesion.findFirst({ where: { nombre: "Odontólogo General", tenantId: tenant.id } });
if (!profesion) {
  profesion = await prisma.profesion.create({
    data: {
      id: randomUUID(),
      tenantId: tenant.id,
      nombre: "Odontólogo General",
      descripcion: "Medico especialista en odontología general",
      activo: true,
    },
  });
  console.log("Profesión creada: " + profesion.nombre);
}

// 10. Crear Medico y asociarlo al Empleado y Profesion
let medico = await prisma.medico.findFirst({ where: { idEmpleado: empleado.id, tenantId: tenant.id } });
if (!medico) {
  medico = await prisma.medico.create({
    data: {
      id: randomUUID(),
      tenantId: tenant.id,
      idEmpleado: empleado.id,
      profesionId: profesion.id,
      activo: true,
    },
  });
  console.log("Medico creado para el empleado: " + empleado.nombre);
}



  let platformRole = await prisma.rol.findFirst({ where: { nombre: "OwnerPlatform", tenantId: platformTenant.id } });
  if (!platformRole) {
    platformRole = await prisma.rol.create({
      data: {
        id: randomUUID(),
        tenantId: platformTenant.id,
        nombre: "OwnerPlatform",
        descripcion: "Rol dueño del SaaS con acceso global de administración",
        activo: true,
      },
    });
  }

  const platformPermisosData = [
    { nombre: "ver_dashboard_admin", descripcion: "Permiso para ver dashboard global de tenants" },
    { nombre: "gestionar_tenants", descripcion: "Permiso para crear y gestionar tenants" },
  ];

  const platformPermisos: { id: string }[] = [];
  for (const pp of platformPermisosData) {
    let p = await prisma.permiso.findFirst({ where: { tenantId: platformTenant.id, nombre: pp.nombre } });
    if (!p) {
      p = await prisma.permiso.create({
        data: {
          id: randomUUID(),
          tenantId: platformTenant.id,
          nombre: pp.nombre,
          descripcion: pp.descripcion,
          activo: true,
        },
      });
    }
    platformPermisos.push({ id: p.id });
  }

  for (const perm of platformPermisos) {
    const exists = await prisma.rolPermiso.findFirst({
      where: { rolId: platformRole.id, permisoId: perm.id },
    });
    if (!exists) {
      await prisma.rolPermiso.create({ data: { rolId: platformRole.id, permisoId: perm.id } });
    }
  }

  let ownerPuesto = await prisma.puesto.findFirst({ where: { Nombre: "Owner SaaS", tenantId: platformTenant.id } });
  if (!ownerPuesto) {
    ownerPuesto = await prisma.puesto.create({
      data: {
        Id: randomUUID(),
        tenantId: platformTenant.id,
        Nombre: "Owner SaaS",
        Descripcion: "Administrador principal de la plataforma",
        Activo: true,
      },
    });
  }

  let ownerEmpleado = await prisma.empleados.findFirst({ where: { correo: "owner@platform.local", tenantId: platformTenant.id } });
  if (!ownerEmpleado) {
    ownerEmpleado = await prisma.empleados.create({
      data: {
        id: randomUUID(),
        tenantId: platformTenant.id,
        nombre: "Owner",
        apellido: "Platform",
        puesto_id: ownerPuesto.Id,
        correo: "owner@platform.local",
        FechaNacimiento: new Date(1990, 1, 1),
        fechaIngreso: new Date(),
        telefono: "0000-0000",
        identidad: `OWNER-${Date.now()}`,
        Vacaciones: 0,
        genero: "N/A",
        activo: true,
      },
    });
  }

  let ownerUsuario = await prisma.usuarios.findFirst({ where: { usuario: "owner.platform", tenantId: platformTenant.id } });
  if (!ownerUsuario) {
    ownerUsuario = await prisma.usuarios.create({
      data: {
        id: randomUUID(),
        tenantId: platformTenant.id,
        usuario: "owner.platform",
        contrasena: await bcrypt.hash("owner.platform", 10),
        empleado_id: ownerEmpleado.id,
        rol_id: platformRole.id,
        activo: true,
        DebeCambiarPassword: false,
      },
    });
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
