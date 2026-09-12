"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Message } from "@/lib/generated/prisma/client";
import { MessageComposer } from "./message-composer";

export function ThreadView({
  conversationId,
  messages,
  currentUserId,
  senderNames,
}: {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
  senderNames: Record<string, string>;
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat:message" && data.conversationId === conversationId) {
          router.refresh();
        }
      } catch {
        // messaggio non valido: ignorato.
      }
    };
    return () => ws.close();
  }, [conversationId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Nessun messaggio ancora. Scrivi il primo!</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                    mine ? "bg-pine-strong text-white" : "bg-paper text-ink"
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-medium opacity-70">{senderNames[m.senderId]}</p>
                  )}
                  {m.testo && <p className="whitespace-pre-wrap">{m.testo}</p>}
                  {m.allegato && (
                    <a
                      href={`/api/chat/${m.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-1 block text-xs underline ${mine ? "text-white" : "text-pine-strong"}`}
                    >
                      Allegato
                    </a>
                  )}
                  <p className={`mt-1 text-[0.65rem] ${mine ? "text-white/70" : "text-muted"}`}>
                    {m.createdAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <MessageComposer conversationId={conversationId} />
    </div>
  );
}
