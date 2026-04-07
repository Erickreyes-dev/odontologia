"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendWhatsappFromModule, type WhatsappChatPaciente, type WhatsappChatThread } from "../actions";

interface Props {
  enabled: boolean;
  estado: string;
  pacientes: WhatsappChatPaciente[];
  threads: WhatsappChatThread[];
}

export default function WhatsappChatClient({ enabled, estado, pacientes, threads }: Props) {
  const [pacienteId, setPacienteId] = useState("");
  const [telefonoManual, setTelefonoManual] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isPending, startTransition] = useTransition();

  const pacienteTelefono = useMemo(() => {
    const patient = pacientes.find((p) => p.id === pacienteId);
    return patient?.telefono ?? "";
  }, [pacienteId, pacientes]);

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendWhatsappFromModule({
        pacienteId: pacienteId || undefined,
        telefono: telefonoManual || undefined,
        mensaje,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Mensaje enviado por WhatsApp");
      setMensaje("");
      setTelefonoManual("");
      setPacienteId("");
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo chat</CardTitle>
          <CardDescription>
            {enabled ? "Seleccione paciente o escriba un número." : `WhatsApp no configurado (${estado}).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="paciente">Paciente del tenant</Label>
            <select
              id="paciente"
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={!enabled}
            >
              <option value="">Seleccionar paciente...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} · {p.telefono}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefono">O número manual</Label>
            <Input
              id="telefono"
              value={telefonoManual}
              onChange={(e) => setTelefonoManual(e.target.value)}
              placeholder={pacienteTelefono || "+50499990000"}
              disabled={!enabled}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="mensaje">Mensaje</Label>
            <Textarea
              id="mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={5}
              maxLength={1500}
              disabled={!enabled}
            />
          </div>

          <Button type="button" onClick={handleSend} disabled={!enabled || isPending || !mensaje.trim()}>
            {isPending ? "Enviando..." : "Enviar WhatsApp"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chats recientes</CardTitle>
          <CardDescription>Últimos contactos por número.</CardDescription>
        </CardHeader>
        <CardContent>
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay mensajes aún.</p>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => (
                <div key={thread.phone} className="rounded border p-2">
                  <p className="text-sm font-medium">{thread.phone}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{thread.lastMessage}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
