import { getEquiposInstrumentos } from "../actions";
import { EquipoInstrumentoForm } from "./equipo-form";
import { EquiposInstrumentosTable } from "./equipos-table";

const dateInput = (d: Date) => d.toISOString().slice(0, 10);

export default async function EquiposPage() {
  const equipos = await getEquiposInstrumentos();
  const data = equipos.map((equipo) => ({
    id: equipo.id,
    nombre: equipo.nombre,
    descripcion: equipo.descripcion ?? "-",
    cantidad: Number(equipo.cantidad ?? 0),
    costoTotal: Number(equipo.costoTotal ?? 0),
    activo: equipo.activo,
    fecha: dateInput(equipo.createAt),
  }));

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Equipos e instrumentos</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo independiente para activos, equipos e instrumentos. No se sincroniza con el inventario de productos.
        </p>
      </div>

      <EquipoInstrumentoForm />
      <EquiposInstrumentosTable data={data} />
    </div>
  );
}
