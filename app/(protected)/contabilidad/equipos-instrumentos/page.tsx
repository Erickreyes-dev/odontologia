import { getEquiposInstrumentos } from "../actions";
import { EquipoInstrumentoForm } from "./equipo-form";

const f = (v: unknown) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

export default async function EquiposPage() {
  const equipos = await getEquiposInstrumentos();

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Equipos e instrumentos</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo independiente para activos, equipos e instrumentos. No se sincroniza con el inventario de productos.
        </p>
      </div>

      <EquipoInstrumentoForm />

      <table className="w-full rounded-lg border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Descripción</th>
            <th className="p-2 text-right">Cantidad</th>
            <th className="p-2 text-right">Costo total</th>
            <th className="p-2 text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((equipo) => (
            <tr key={equipo.id} className="border-t">
              <td className="p-2">{equipo.nombre}</td>
              <td className="p-2">{equipo.descripcion ?? "-"}</td>
              <td className="p-2 text-right">{Number(equipo.cantidad ?? 0).toLocaleString("es-HN")}</td>
              <td className="p-2 text-right">{f(equipo.costoTotal)}</td>
              <td className="p-2 text-center">{equipo.activo ? "Activo" : "Inactivo"}</td>
            </tr>
          ))}
          {equipos.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-muted-foreground">No hay equipos o instrumentos registrados.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
