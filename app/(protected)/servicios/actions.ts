"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Servicio } from "./schema";

// Obtener todos los servicios
export async function getServicios(): Promise<Servicio[]> {
    const servicios = await prisma.servicio.findMany({
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
        medicos: s.medicosServicios.map(ms => ({
            idEmpleado: ms.medico.idEmpleado,
            nombre: ms.medico.empleado.nombre,
            apellido: ms.medico.empleado.apellido,
        })),
    }));
}

// Obtener un servicio por ID
export async function getServicioById(id: string): Promise<Servicio | null> {
    const s = await prisma.servicio.findUnique({
        where: { id },
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
        data: {
            id: randomUUID(),
            nombre: data.nombre,
            descripcion: data.descripcion,
            precioBase: data.precioBase,
            duracionMin: data.duracionMin,
            activo: data.activo ?? true,
            // Solo incluimos medicosServicios si hay medicos
            medicosServicios: data.medicos && data.medicos.length > 0
                ? {
                    create: data.medicos.map(m => ({
                        medicoId: m.idEmpleado,
                    })),
                }
                : undefined,
        },
    });
    return servicio;
}


// Actualizar un servicio
export async function putServicio(data: Servicio) {
    const servicio = await prisma.servicio.update({
        where: { id: data.id! },
        data: {
            nombre: data.nombre,
            descripcion: data.descripcion,
            precioBase: data.precioBase,
            duracionMin: data.duracionMin,
            activo: data.activo,
            medicosServicios: {
                deleteMany: {},
                create: data.medicos?.map(m => ({ medicoId: m.idEmpleado })),
            },
        },
    });
    return servicio;
}
