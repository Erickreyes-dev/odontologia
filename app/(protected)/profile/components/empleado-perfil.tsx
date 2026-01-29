import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Mail, Phone } from "lucide-react"
import type { Employee } from "../type"
import { calcularEdad, calculateServiceDuration } from "@/lib/utils"

interface EmployeeProfileProps {
    employee: Employee
}

export default function EmployeeProfile({ employee }: EmployeeProfileProps) {
    const initials = `${employee.nombre?.charAt(0) ?? ""}${employee.apellido?.charAt(0) ?? ""}`
    const yearsOfService = calculateServiceDuration(employee.fechaIngreso)

    return (
        <div className="mx-auto">
            <Card className="w-full">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold">
                                        {employee.nombre ?? ""} {employee.apellido ?? ""}
                                    </h2>
                                    <Badge variant={employee.activo ? "default" : "outline"}>
                                        {employee.activo ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground">{employee.puesto ?? "Sin Puesto"}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Mail className="mr-1 h-4 w-4" />
                                    {employee.correo ?? "No especificado"}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="mr-1 h-4 w-4" />
                                    {employee.telefono ?? "No especificado"}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Información Personal */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Información Personal</h3>
                            <dl className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground">Identificación:</dt>
                                <dd>{employee.identidad ?? "No especificado"}</dd>

                                <dt className="font-medium text-muted-foreground">Usuario:</dt>
                                <dd>{employee.usuario ?? "Sin usuario"}</dd>

                                <dt className="font-medium text-muted-foreground">Edad:</dt>
                                <dd>{calcularEdad(employee.fechaNacimiento ?? new Date())} años</dd>

                                <dt className="font-medium text-muted-foreground">Género:</dt>
                                <dd>{employee.genero ?? "No especificado"}</dd>


                                <dt className="font-medium text-muted-foreground">Fecha de Nacimiento:</dt>
                                <dd>
                                    {employee.fechaNacimiento
                                        ? format(new Date(employee.fechaNacimiento), "dd 'de' MMMM 'de' yyyy", { locale: es })
                                        : "No especificado"}
                                </dd>

                                <dt className="font-medium text-muted-foreground">Fecha de Ingreso:</dt>
                                <dd>
                                    {employee.fechaIngreso
                                        ? format(new Date(employee.fechaIngreso), "dd 'de' MMMM 'de' yyyy", { locale: es })
                                        : "No especificado"}
                                </dd>

                                <dt className="font-medium text-muted-foreground">Años de Servicio:</dt>
                                <dd>
                                    {yearsOfService.years} años {yearsOfService.months} meses {yearsOfService.days} días
                                </dd>

                                <dt className="font-medium text-muted-foreground">Vacaciones:</dt>
                                <dd>{employee.vacaciones ?? 0} días</dd>
                            </dl>
                        </div>

                        {/* Información de Contacto */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Información de Contacto</h3>
                            <dl className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground">Teléfono:</dt>
                                <dd>{employee.telefono ?? "No especificado"}</dd>

                                <dt className="font-medium text-muted-foreground">Correo:</dt>
                                <dd>{employee.correo ?? "No especificado"}</dd>
                            </dl>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
