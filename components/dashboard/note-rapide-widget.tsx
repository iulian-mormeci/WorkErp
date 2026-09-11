import Link from "next/link";
import { StickyNote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WidgetShell } from "./widget-shell";

export async function NoteRapideWidget({ userId }: { userId: string }) {
  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <WidgetShell title="Note rapide" icon={StickyNote} href="/note">
      {notes.length === 0 ? (
        <p className="text-sm text-muted">Nessuna nota ancora.</p>
      ) : (
        <ul className="space-y-1.5">
          {notes.map((note) => (
            <li key={note.id}>
              <Link href="/note" className="block truncate text-sm text-ink hover:text-pine-strong">
                {note.titolo}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
