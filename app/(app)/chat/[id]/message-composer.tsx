"use client";

import { useRef, useTransition } from "react";
import { Send, Paperclip } from "lucide-react";
import { sendMessage } from "../actions";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const bound = sendMessage.bind(null, conversationId);

  async function handleSubmit(formData: FormData) {
    await bound(formData);
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => handleSubmit(formData))}
      className="flex items-end gap-2 border-t border-line pt-3"
    >
      <input type="file" name="allegato" className="hidden" id="chat-file-input" />
      <label
        htmlFor="chat-file-input"
        className="cursor-pointer rounded-md border border-line p-2 text-muted hover:text-ink"
      >
        <Paperclip className="size-4" />
      </label>
      <textarea
        name="testo"
        rows={1}
        placeholder="Scrivi un messaggio…"
        className="flex-1 resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
      />
      <button
        type="submit"
        disabled={isPending}
        aria-label="Invia"
        className="rounded-md bg-pine-strong p-2 text-white hover:opacity-90 disabled:opacity-50"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}
