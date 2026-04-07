"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendWhatsappFromModule, type WhatsappChatMessage, type WhatsappChatPaciente, type WhatsappChatThread } from "../actions";

interface Props {
  enabled: boolean;
  estado: string;
  pacientes: WhatsappChatPaciente[];
  threads: WhatsappChatThread[];
  messages: WhatsappChatMessage[];
}

export default function WhatsappChatClient({ enabled, estado, pacientes, threads, messages }: Props) {
  const router = useRouter();
  const [pacienteId, setPacienteId] = useState("");
  const [telefonoManual, setTelefonoManual] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [activePhone, setActivePhone] = useState("");
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
      router.refresh();
    });
  };

  const conversation = useMemo(() => {
    if (!activePhone) return [];
    return messages.filter((message) => message.phone === activePhone);
  }, [activePhone, messages]);

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

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Conversaciones</CardTitle>
          <CardDescription>Selecciona un chat para ver la conversación completa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            {threads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay mensajes aún.</p>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.phone}
                  type="button"
                  className={`w-full rounded border p-2 text-left ${activePhone === thread.phone ? "border-primary" : ""}`}
                  onClick={() => setActivePhone(thread.phone)}
                >
                  <p className="text-sm font-medium">{thread.phone}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{thread.lastMessage}</p>
                </button>
              ))
            )}
          </div>
          <div className="lg:col-span-2 rounded border p-3 max-h-[420px] overflow-y-auto space-y-2">
            {!activePhone ? (
              <p className="text-sm text-muted-foreground">Elige un chat para ver mensajes.</p>
            ) : conversation.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay mensajes en esta conversación.</p>
            ) : (
              conversation.map((message) => (
                <div
                  key={message.id}
                  className={`rounded px-3 py-2 text-sm max-w-[85%] ${message.direction === "saliente" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  <p>{message.body || "(sin texto)"}</p>
                  <p className="mt-1 text-[10px] opacity-80">{new Date(message.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
