"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getPacienteConversation, sendPacienteWhatsAppDocument, sendPacienteWhatsAppText } from "@/app/(protected)/pacientes/whatsapp-actions";

type ChatMessage = {
  id: string;
  direction: "outbound" | "inbound" | "system";
  body: string | null;
  providerStatus: string;
  createdAt: Date;
  mediaUrl?: string | null;
};

export function WhatsAppChatPanel({ pacienteId }: { pacienteId: string }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadConversation = useCallback(async () => {
    try {
      const data = await getPacienteConversation(pacienteId);
      setConversationId(data.conversation.id);
      setMessages(data.messages as ChatMessage[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la conversación");
    }
  }, [pacienteId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 overflow-auto rounded border p-3 space-y-2">
          {messages.map((message) => (
            <div key={message.id} className={`rounded p-2 text-sm ${message.direction === "outbound" ? "bg-emerald-50" : "bg-muted"}`}>
              <p>{message.body ?? "(sin texto)"}</p>
              {message.mediaUrl ? <a href={message.mediaUrl} target="_blank" className="underline">Adjunto</a> : null}
              <p className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()} · {message.providerStatus}</p>
            </div>
          ))}
        </div>

        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje" />
        <div className="flex gap-2">
          <Button
            disabled={!conversationId || !text.trim() || isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await sendPacienteWhatsAppText({ pacienteId, conversationId: conversationId!, body: text.trim() });
                  setText("");
                  await loadConversation();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "No se pudo enviar el mensaje");
                }
              })
            }
          >Enviar texto</Button>
        </div>

        <Input value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="URL segura del documento (https://...)" />
        <Input value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="Nombre de archivo (opcional)" />
        <Button
          variant="outline"
          disabled={!conversationId || !documentUrl.trim() || isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                await sendPacienteWhatsAppDocument({
                  pacienteId,
                  conversationId: conversationId!,
                  documentUrl: documentUrl.trim(),
                  fileName: documentName.trim() || undefined,
                });
                setDocumentUrl("");
                setDocumentName("");
                await loadConversation();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "No se pudo enviar el documento");
              }
            })
          }
        >Enviar documento</Button>
      </CardContent>
    </Card>
  );
}
