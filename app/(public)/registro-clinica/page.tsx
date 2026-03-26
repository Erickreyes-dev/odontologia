import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RegistroClinicaWizard } from "./registro-clinica-wizard";

export default async function RegistroClinicaPage() {
  const activePackages = await prisma.paquete.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, maxUsuarios: true },
    orderBy: [{ maxUsuarios: "asc" }, { createAt: "asc" }],
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-cyan-300">
          <ArrowLeft className="h-4 w-4" /> Volver al login
        </Link>
        <RegistroClinicaWizard activePackages={activePackages} />
      </div>
    </div>
  );
}
