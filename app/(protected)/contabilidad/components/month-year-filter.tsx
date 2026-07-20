const months = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export function MonthYearFilter({ month, year }: { month: number; year: number }) {
  return (
    <form className="flex flex-wrap gap-2">
      <select name="month" defaultValue={String(month)} className="rounded-md border p-2">
        {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <input name="year" type="number" defaultValue={year} className="rounded-md border p-2" />
      <button className="rounded-md border px-4">Filtrar</button>
    </form>
  );
}
