import Link from "next/link";
import { Users } from "lucide-react";

export type ConversationRow = {
  id: string;
  nome: string;
  isGroup: boolean;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unread: boolean;
};

export function ConversationItem({ conversation }: { conversation: ConversationRow }) {
  return (
    <Link
      href={`/chat/${conversation.id}`}
      className="flex items-center gap-3 rounded-md border border-line bg-surface p-3 hover:bg-paper"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine-strong">
        {conversation.isGroup ? (
          <Users className="size-4" />
        ) : (
          <span className="text-sm font-medium">{conversation.nome.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm ${conversation.unread ? "font-semibold text-ink" : "text-ink"}`}>
            {conversation.nome}
          </p>
          {conversation.lastMessageAt && (
            <span className="shrink-0 text-xs text-muted">
              {conversation.lastMessageAt.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted">{conversation.lastMessage ?? "Nessun messaggio ancora."}</p>
      </div>
      {conversation.unread && <span className="size-2.5 shrink-0 rounded-full bg-pine-strong" />}
    </Link>
  );
}
