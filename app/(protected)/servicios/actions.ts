"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Servicio } from "./schema";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";

// Obtener todos los servicios
export async function getServicios(): Promise<Servicio[]> {
    const servicios = await prisma.servicio.findMany({
        where: await tenantWhere<Prisma.ServicioWhereInput>(),
        include: {
            medicosServicios: {
                include: {
                    medico: {
                        include: { empleado: true },
                    },
                },
            },
        },
    });

    return servicios.map(s => ({
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion || "",
        precioBase: Number(s.precioBase),
        duracionMin: s.duracionMin,
        activo: s.activo,
        mostrarEnLanding: s.mostrarEnLanding,
        medicos: s.medicosServicios.map(ms => ({
            idEmpleado: ms.medico.idEmpleado,
            nombre: ms.medico.empleado.nombre,
            apellido: ms.medico.empleado.apellido,
        })),
    }));
}

// Obtener un servicio por ID
export async function getServicioById(id: string): Promise<Servicio | null> {
    const s = await prisma.servicio.findFirst({
        where: await tenantWhere<Prisma.ServicioWhereInput>({ id }),
        include: { medicosServicios: { include: { medico: { include: { empleado: true } } } } },
    });
    if (!s) return null;

    return {
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion || "",
        precioBase: Number(s.precioBase),
        duracionMin: s.duracionMin,
        activo: s.activo,
        mostrarEnLanding: s.mostrarEnLanding,
        medicos: s.medicosServicios.map(ms => ({
            idEmpleado: ms.medico.idEmpleado,
            nombre: ms.medico.empleado.nombre,
            apellido: ms.medico.empleado.apellido,
        })),
    };
}

// Crear un servicio
export async function postServicio(data: Servicio) {
    const servicio = await prisma.servicio.create({
        data: await withTenantData({
            id: randomUUID(),
            nombre: data.nombre,
            descripcion: data.descripcion,
            precioBase: data.precioBase,
            duracionMin: data.duracionMin,
            activo: data.activo ?? true,
            mostrarEnLanding: data.mostrarEnLanding ?? false,
            // Solo incluimos medicosServicios si hay medicos
            medicosServicios: data.medicos && data.medicos.length > 0
                ? {
                    create: data.medicos.map(m => ({
                        medicoId: m.idEmpleado,
                    })),
                }
                : undefined,
        }),
    });
    return servicio;
}


// Actualizar un servicio
export async function putServicio(data: Servicio) {
    const existing = await prisma.servicio.findFirst({ where: await tenantWhere<Prisma.ServicioWhereInput>({ id: data.id! }) });
    if (!existing) throw new Error("Servicio no encontrado en la clínica");

    const servicio = await prisma.servicio.update({
        where: { id: existing.id },
        data: {
            nombre: data.nombre,
            descripcion: data.descripcion,
            precioBase: data.precioBase,
            duracionMin: data.duracionMin,
            activo: data.activo,
            mostrarEnLanding: data.mostrarEnLanding ?? false,
            medicosServicios: {
                deleteMany: {},
                create: data.medicos?.map(m => ({ medicoId: m.idEmpleado })),
            },
        },
    });
    return servicio;
}
