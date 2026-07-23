import HeaderComponent from "@/components/HeaderComponent";
import { ListPlus } from "lucide-react";
import { getCatalogosPaciente } from "../../pacientes/actions";
import { CatalogosPacienteForms } from "./components/catalogos-paciente-forms";

export default async function CatalogosMantenimientoPage() {
  const catalogos = await getCatalogosPaciente();

  return (
    <div className="container mx-auto space-y-6 py-4">
      <HeaderComponent Icon={ListPlus} screenName="Catálogos de mantenimiento" description="Administra opciones reutilizables para admisión de pacientes." />
      <CatalogosPacienteForms />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Opciones: ¿Cómo conoció la clínica?</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {catalogos.conocioClinica.map((item) => <li key={item.id}>{item.nombre}</li>)}
          </ul>
        </section>
        <section className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Opciones: decisión de agendar/venir</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {catalogos.decisionAgendar.map((item) => <li key={item.id}>{item.nombre}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
