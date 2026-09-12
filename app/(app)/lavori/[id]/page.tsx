import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { jobStatusLabel } from "@/lib/job-status";
import { ChecklistSection } from "@/components/detail/checklist-section";
import { TimelineSection } from "@/components/detail/timeline-section";
import { JobDetailActions } from "./job-detail-actions";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      checklistItems: { orderBy: { ordine: "asc" } },
      timelineEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!job || job.userId !== user.id) notFound();

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <Link href="/lavori" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Lavori
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-ink">{job.titolo}</h1>
            <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
              {jobStatusLabel(job.stato)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                job.origine === "UNOERP" ? "bg-amber/15 text-amber" : "bg-paper text-muted"
              }`}
            >
              {job.origine === "UNOERP" ? "UnoERP" : "Manuale"}
            </span>
          </div>
          {(job.cliente || job.indirizzo) && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              {job.indirizzo && <MapPin className="size-3.5 shrink-0" />}
              {[job.cliente, job.indirizzo].filter(Boolean).join(" · ")}
            </p>
          )}
          {(job.categoria || job.priorita) && (
            <p className="mt-1 text-xs text-muted">
              {[job.categoria, job.priorita && `Priorità: ${job.priorita}`].filter(Boolean).join(" · ")}
            </p>
          )}
          {job.note && <p className="mt-1 text-sm text-muted">{job.note}</p>}
          {job.programmatoIl && (
            <p className="mt-1 text-xs text-muted">
              Programmato per il{" "}
              {job.programmatoIl.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
          {job.scadenza && (
            <p className="mt-1 text-xs text-muted">
              Scadenza{" "}
              {job.scadenza.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
              {job.oraInizio && job.oraFine && ` · ${job.oraInizio}–${job.oraFine}`}
            </p>
          )}
        </div>
        <JobDetailActions job={job} />
      </header>

      <ChecklistSection items={job.checklistItems} jobId={job.id} />
      <TimelineSection events={job.timelineEvents} />
    </div>
  );
}
