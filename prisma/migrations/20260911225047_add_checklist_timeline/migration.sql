-- CreateEnum
CREATE TYPE "TimelineEventTipo" AS ENUM ('CREATO', 'INIZIATO', 'CHECKLIST_COMPLETATA', 'COMPLETATO', 'POSTICIPATO');

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "jobId" TEXT,
    "testo" TEXT NOT NULL,
    "completato" BOOLEAN NOT NULL DEFAULT false,
    "completatoAt" TIMESTAMP(3),
    "ordine" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "jobId" TEXT,
    "tipo" "TimelineEventTipo" NOT NULL,
    "dettaglio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checklist_items_taskId_idx" ON "checklist_items"("taskId");

-- CreateIndex
CREATE INDEX "checklist_items_jobId_idx" ON "checklist_items"("jobId");

-- CreateIndex
CREATE INDEX "timeline_events_taskId_idx" ON "timeline_events"("taskId");

-- CreateIndex
CREATE INDEX "timeline_events_jobId_idx" ON "timeline_events"("jobId");

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
