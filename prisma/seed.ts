import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { PLATFORM_PERMISSIONS, TENANT_PERMISSIONS } from "@/lib/permission-catalog";

const prisma = new PrismaClient();

type BaseTenantData = {
  nombre: string;
  slug: string;
  plan: string;
  maxUsuarios: number;
  contactoNombre?: string;
  contactoCorreo?: string;
};

async function ensureTenant(data: BaseTenantData) {
  const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
  if (existing) return existing;

  return prisma.tenant.create({
    data: {
      id: randomUUID(),
      nombre: data.nombre,
      slug: data.slug,
      activo: true,
      plan: data.plan,
      maxUsuarios: data.maxUsuarios,
    },
  });
}

async function ensureTenantPermissionSet(tenantId: string, permissions: { nombre: string; descripcion: string }[]) {
  const result: { id: string; nombre: string }[] = [];

  for (const permission of permissions) {
    let record = await prisma.permiso.findFirst({
      where: { tenantId, nombre: permission.nombre },
    });

    if (!record) {
      record = await prisma.permiso.create({
        data: {
          id: randomUUID(),
          tenantId,
          nombre: permission.nombre,
          descripcion: permission.descripcion,
          activo: true,
        },
      });
    }

    result.push({ id: record.id, nombre: record.nombre });
  }

  return result;
}

async function ensureRoleWithPermissions(tenantId: string, roleName: string, description: string, permissionIds: string[]) {
  let role = await prisma.rol.findFirst({ where: { tenantId, nombre: roleName } });

  if (!role) {
    role = await prisma.rol.create({
      data: {
        id: randomUUID(),
        tenantId,
        nombre: roleName,
        descripcion: description,
        activo: true,
      },
    });
  }

  const existing = await prisma.rolPermiso.findMany({ where: { rolId: role.id } });
  const existingSet = new Set(existing.map((e) => e.permisoId));

  for (const permissionId of permissionIds) {
    if (!existingSet.has(permissionId)) {
      await prisma.rolPermiso.create({
        data: {
          id: randomUUID(),
          rolId: role.id,
          permisoId: permissionId,
        },
      });
    }
  }

  return role;
}

async function main() {
  const resetData = process.env.RESET_SEED === "true";

  if (resetData) {
    await prisma.rolPermiso.deleteMany();
    await prisma.usuarios.deleteMany();
    await prisma.medico.deleteMany();
    await prisma.empleados.deleteMany();
    await prisma.puesto.deleteMany();
    await prisma.rol.deleteMany();
    await prisma.permiso.deleteMany();
    await prisma.profesion.deleteMany();
    await prisma.tenant.deleteMany();
    console.log("Datos anteriores eliminados");
  }

  const tenantDemo = await ensureTenant({
    nombre: "Clínica Demo",
    slug: "demo-clinica",
    plan: "starter",
    maxUsuarios: 20,
    contactoNombre: "Administrador Demo",
    contactoCorreo: "admin@demo.local",
  });

  const tenantPlatform = await ensureTenant({
    nombre: "Plataforma SaaS",
    slug: "platform",
    plan: "enterprise",
    maxUsuarios: 1000,
    contactoNombre: "Owner Platform",
    contactoCorreo: "owner@platform.local",
  });

  const demoPermissions = await ensureTenantPermissionSet(tenantDemo.id, TENANT_PERMISSIONS);
  const demoAdminRole = await ensureRoleWithPermissions(
    tenantDemo.id,
    "Administrador",
    "Rol con acceso total del tenant",
    demoPermissions.map((p) => p.id)
  );

  let puestoDemo = await prisma.puesto.findFirst({ where: { tenantId: tenantDemo.id, Nombre: "Desarrollador SR" } });
  if (!puestoDemo) {
    puestoDemo = await prisma.puesto.create({
      data: {
        Id: randomUUID(),
        tenantId: tenantDemo.id,
        Nombre: "Desarrollador SR",
        Descripcion: "Desarrollador SR de software",
        Activo: true,
      },
    });
  }

  let empleadoDemo = await prisma.empleados.findFirst({ where: { tenantId: tenantDemo.id, correo: "erickjosepineda33@gmail.com" } });
  if (!empleadoDemo) {
    empleadoDemo = await prisma.empleados.create({
      data: {
        id: randomUUID(),
        tenantId: tenantDemo.id,
        nombre: "Erick",
        apellido: "Reyes",
        puesto_id: puestoDemo.Id,
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
  }

  const demoUser = await prisma.usuarios.findFirst({ where: { tenantId: tenantDemo.id, usuario: "erick.reyes" } });
  if (!demoUser) {
    await prisma.usuarios.create({
      data: {
        id: randomUUID(),
        tenantId: tenantDemo.id,
        usuario: "erick.reyes",
        contrasena: await bcrypt.hash("erick.reyes", 10),
        empleado_id: empleadoDemo.id,
        rol_id: demoAdminRole.id,
        activo: true,
        DebeCambiarPassword: false,
      },
    });
  }

  let profesion = await prisma.profesion.findFirst({ where: { tenantId: tenantDemo.id, nombre: "Odontólogo General" } });
  if (!profesion) {
    profesion = await prisma.profesion.create({
      data: {
        id: randomUUID(),
        tenantId: tenantDemo.id,
        nombre: "Odontólogo General",
        descripcion: "Medico especialista en odontología general",
        activo: true,
      },
    });
  }

  const demoMedico = await prisma.medico.findFirst({ where: { tenantId: tenantDemo.id, idEmpleado: empleadoDemo.id } });
  if (!demoMedico) {
    await prisma.medico.create({
      data: {
        id: randomUUID(),
        tenantId: tenantDemo.id,
        idEmpleado: empleadoDemo.id,
        profesionId: profesion.id,
        activo: true,
      },
    });
  }

  const platformPermissions = await ensureTenantPermissionSet(tenantPlatform.id, PLATFORM_PERMISSIONS);
  const ownerPlatformRole = await ensureRoleWithPermissions(
    tenantPlatform.id,
    "OwnerPlatform",
    "Rol dueño del SaaS con acceso global de administración",
    platformPermissions.map((p) => p.id)
  );

  const ownerPlatform = await prisma.usuarios.findFirst({ where: { tenantId: tenantPlatform.id, usuario: "owner.platform" } });
  if (!ownerPlatform) {
    await prisma.usuarios.create({
      data: {
        id: randomUUID(),
        tenantId: tenantPlatform.id,
        usuario: "owner.platform",
        contrasena: await bcrypt.hash("owner.platform", 10),
        empleado_id: null,
        rol_id: ownerPlatformRole.id,
        activo: true,
        DebeCambiarPassword: false,
      },
    });
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
