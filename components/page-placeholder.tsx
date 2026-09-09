import type { LucideIcon } from "lucide-react";

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6 py-8 md:px-10 md:py-10">
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line py-16 text-center">
        <Icon className="size-6 text-muted" strokeWidth={1.5} />
        <p className="text-sm text-muted">
          Questa sezione arriva in uno dei prossimi passi.
        </p>
      </div>
    </div>
  );
}
