/*
  Warnings:

  - Added the required column `ownerId` to the `manuals` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Ruolo" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('MINI_CALENDARIO', 'PROSSIME_ATTIVITA', 'PROSSIMI_LAVORI', 'NOTE_RAPIDE', 'MANUALI_RAPIDI');

-- CreateEnum
CREATE TYPE "ModerazioneStato" AS ENUM ('IN_ATTESA', 'APPROVATO', 'RIFIUTATO');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "oraFine" TEXT,
ADD COLUMN     "oraInizio" TEXT,
ADD COLUMN     "scadenza" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "manuals" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderazioneStato" "ModerazioneStato" NOT NULL DEFAULT 'IN_ATTESA',
ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "oraFine" TEXT,
ADD COLUMN     "oraInizio" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "ruolo" "Ruolo" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "user_categories" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widget_layouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipoWidget" "WidgetType" NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "w" INTEGER NOT NULL,
    "h" INTEGER NOT NULL,

    CONSTRAINT "dashboard_widget_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_manual_library" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "manualId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_manual_library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_widget_layouts_userId_tipoWidget_key" ON "dashboard_widget_layouts"("userId", "tipoWidget");

-- CreateIndex
CREATE UNIQUE INDEX "user_manual_library_userId_manualId_key" ON "user_manual_library"("userId", "manualId");

-- CreateIndex
CREATE INDEX "manuals_ownerId_idx" ON "manuals"("ownerId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "user_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widget_layouts" ADD CONSTRAINT "dashboard_widget_layouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manuals" ADD CONSTRAINT "manuals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_manual_library" ADD CONSTRAINT "user_manual_library_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_manual_library" ADD CONSTRAINT "user_manual_library_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "manuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
