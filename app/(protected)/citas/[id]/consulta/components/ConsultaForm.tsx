"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { differenceInYears, format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, FileText, Loader2, Receipt, Stethoscope, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { ConsultaSchema, Consulta } from "../schema";
import { upsertConsulta } from "../actions";
import { OrdenCobroFormModal } from "@/app/(protected)/ordenes-cobro/components/OrdenCobroFormModal";

interface CitaData {
  id: string;
  fechaHora: Date;
  estado: string;
  motivo: string | null;
  observacion: string | null;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    identidad: string;
    telefono?: string | null;
    correo?: string | null;
    fechaNacimiento?: Date | null;
    genero?: string | null;
  } | null;
  medico: {
    idEmpleado: string;
    empleado?: {
      nombre: string;
      apellido: string;
    } | null;
  } | null;
  consultorio: {
    id: string;
    nombre: string;
  } | null;
}

interface ConsultaFormProps {
  cita: CitaData;
  consulta: Consulta | null;
}

export function ConsultaForm({ cita, consulta }: ConsultaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrdenModal, setShowOrdenModal] = useState(false);
  const [savedConsultaForOrden, setSavedConsultaForOrden] = useState<{ id: string } | null>(null);

  const form = useForm<Consulta>({
    resolver: zodResolver(ConsultaSchema),
    defaultValues: {
      id: consulta?.id || undefined,
      citaId: cita.id,
      fechaConsulta: consulta?.fechaConsulta ?? new Date(cita.fechaHora),
      diagnostico: consulta?.diagnostico || "",
      notas: consulta?.notas || "",
      observacionesClinicas: consulta?.observacionesClinicas || "",
    },
  });

  const onSubmit = async (
    data: Consulta,
    options?: { openOrdenModal?: boolean }
  ) => {
    setIsSubmitting(true);

    try {
      const result = await upsertConsulta(data);

      if (result.success) {
        toast.success("Consulta guardada", {
          description: "La consulta se ha guardado correctamente.",
        });
        if (options?.openOrdenModal && result.data?.id) {
          setSavedConsultaForOrden({ id: result.data.id });
          setShowOrdenModal(true);
        } else {
          router.push("/citas");
          router.refresh();
        }
      } else {
        toast.error("Error al guardar", {
          description: result.error || "No se pudo guardar la consulta.",
        });
      }
    } catch {
      toast.error("Error", {
        description: "Ocurrio un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcularEdad = (fechaNacimiento: Date | null | undefined) => {
    if (!fechaNacimiento) return null;
    return differenceInYears(new Date(), new Date(fechaNacimiento));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">
                {cita.paciente?.nombre} {cita.paciente?.apellido}
              </p>
              <p className="text-sm text-muted-foreground">
                {cita.paciente?.identidad}
              </p>
            </div>
            {cita.paciente?.fechaNacimiento && (
              <p className="text-sm">
                <span className="text-muted-foreground">Edad:</span>{" "}
                {calcularEdad(cita.paciente.fechaNacimiento)} anios
              </p>
            )}
            {cita.paciente?.genero && (
              <p className="text-sm">
                <span className="text-muted-foreground">Genero:</span>{" "}
                {cita.paciente.genero}
              </p>
            )}
            {cita.paciente?.telefono && (
              <p className="text-sm">
                <span className="text-muted-foreground">Telefono:</span>{" "}
                {cita.paciente.telefono}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Cita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  cita.estado === "atendida"
                    ? "default"
                    : cita.estado === "programada"
                    ? "outline"
                    : "destructive"
                }
              >
                {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
              </Badge>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Fecha:</span>{" "}
              {format(new Date(cita.fechaHora), "PPP", { locale: es })}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Hora:</span>{" "}
              {format(new Date(cita.fechaHora), "p", { locale: es })}
            </p>
            {cita.consultorio && (
              <p className="text-sm">
                <span className="text-muted-foreground">Consultorio:</span>{" "}
                {cita.consultorio.nombre}
              </p>
            )}
            {cita.motivo && (
              <p className="text-sm">
                <span className="text-muted-foreground">Motivo:</span>{" "}
                {cita.motivo}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4" />
              Medico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              Dr. {cita.medico?.empleado?.nombre} {cita.medico?.empleado?.apellido}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Diagnostico y Observaciones
            </CardTitle>
            <CardDescription>
              Registre el diagnostico y las observaciones clinicas de la consulta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="fechaConsulta"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Fecha de consulta</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value ? new Date(`${value}T00:00:00`) : null);
                      }}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Puede ajustar la fecha de la consulta si es necesario.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="diagnostico"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Diagnostico</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      placeholder="Escriba el diagnostico del paciente..."
                      className="min-h-[100px] resize-y"
                      {...field}
                      value={field.value || ""}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Describa el diagnostico del paciente basado en la evaluacion realizada.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="observacionesClinicas"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Observaciones clinicas</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      placeholder="Observaciones clinicas relevantes..."
                      className="min-h-[120px] resize-y"
                      {...field}
                      value={field.value || ""}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Incluya observaciones clinicas importantes del control.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="notas"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Notas adicionales</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      placeholder="Notas adicionales, recomendaciones, tratamiento..."
                      className="min-h-[120px] resize-y"
                      {...field}
                      value={field.value || ""}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Incluya notas sobre recomendaciones o informacion adicional.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              form.handleSubmit((data) =>
                onSubmit(data, { openOrdenModal: true })
              )()
            }
            disabled={isSubmitting}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Guardar y Generar Orden de Cobro
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : consulta ? (
              "Actualizar Consulta"
            ) : (
              "Registrar Consulta"
            )}
          </Button>
        </div>
      </form>

      <OrdenCobroFormModal
        open={showOrdenModal}
        onOpenChange={(open) => {
          setShowOrdenModal(open);
          if (!open) {
            setSavedConsultaForOrden(null);
            router.push("/citas");
            router.refresh();
          }
        }}
        pacienteId={cita.paciente?.id}
        pacientes={
          cita.paciente
            ? [
                {
                  id: cita.paciente.id,
                  nombre: cita.paciente.nombre,
                  apellido: cita.paciente.apellido,
                },
              ]
            : []
        }
        consultaId={savedConsultaForOrden?.id ?? consulta?.id ?? undefined}
        onSuccess={() => {
          setShowOrdenModal(false);
          setSavedConsultaForOrden(null);
          router.push("/citas");
          router.refresh();
        }}
      />
    </div>
  );
}
