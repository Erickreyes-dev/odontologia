import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function resolveDoctorSenderName(): Promise<string> {
  const session = await getSession();

  if (session?.IdEmpleado) {
    const empleado = await prisma.empleados.findUnique({
      where: { id: session.IdEmpleado },
      select: { nombre: true, apellido: true },
    });

    if (empleado) {
      return `${empleado.nombre} ${empleado.apellido}`.trim();
    }
  }

  return "Doctor";
}

export function buildDoctorFromAddress(doctorName: string): string {
  return `Dr(a). ${doctorName} <sistema@medisoftcore.com>`;
}
