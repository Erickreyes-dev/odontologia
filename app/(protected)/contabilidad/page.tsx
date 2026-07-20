import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  ["Dashboard financiero", "/contabilidad/dashboard-financiero"],
  ["Ingresos", "/contabilidad/ingresos"],
  ["Honorarios médicos", "/contabilidad/honorarios"],
  ["Egresos", "/contabilidad/egresos"],
  ["Estado de resultados", "/contabilidad/estado-resultados"],
  ["Catálogos", "/contabilidad/catalogos"],
  ["Equipos e instrumentos", "/contabilidad/equipos-instrumentos"],
];

export default function ContabilidadPage() {
  return <div className="space-y-6 p-4"><h1 className="text-2xl font-bold">Contabilidad y finanzas</h1><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{links.map(([title,url]) => <Link key={url} href={url}><Card className="h-full transition hover:border-primary"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Gestionar {title.toLowerCase()}.</CardContent></Card></Link>)}</div></div>;
}
