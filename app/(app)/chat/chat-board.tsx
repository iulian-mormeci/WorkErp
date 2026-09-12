"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { ConversationItem, type ConversationRow } from "./conversation-item";

export function ChatBoard({
  conversations,
  children,
}: {
  conversations: ConversationRow[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Chat</h1>
          <p className="mt-1 text-sm text-muted">Messaggi diretti e di gruppo con gli altri utenti.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Nuova conversazione
        </button>
      </div>

      {conversations.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Nessuna conversazione qui. Iniziane una con il pulsante qui sopra.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Nuova conversazione">
        {children}
      </Drawer>
    </>
  );
}
