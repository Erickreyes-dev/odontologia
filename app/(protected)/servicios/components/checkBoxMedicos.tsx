"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Medico } from "../../medicos/schema";

export function CheckboxMedicos({
  medicos,
  selectedMedicos,
  onChange,
}: {
  medicos: Medico[];
  selectedMedicos: string[];
  onChange: (selected: string[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (id: string) => {
    const newSelected = selectedMedicos.includes(id)
      ? selectedMedicos.filter((m) => m !== id)
      : [...selectedMedicos, id];
    onChange(newSelected);
  };

  const filtered = medicos.filter((m) =>
    `${m.empleado?.nombre} ${m.empleado?.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar médicos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <ScrollArea className="h-[250px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((m) => (
            <Label key={m.idEmpleado} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-muted-100">
              <Checkbox
                checked={selectedMedicos.includes(m.idEmpleado)}
                onCheckedChange={() => handleChange(m.idEmpleado)}
              />
              <span>{m.empleado?.nombre} {m.empleado?.apellido}</span>
            </Label>
          ))}
        </div>
      </ScrollArea>
      {filtered.length === 0 && <p className="text-muted-500">No se encontraron médicos.</p>}
    </div>
  );
}
