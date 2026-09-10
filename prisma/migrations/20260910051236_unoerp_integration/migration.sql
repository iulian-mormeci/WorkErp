/*
  Warnings:

  - You are about to drop the `unoerp_tokens` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,unoerpId]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "unoerp_tokens" DROP CONSTRAINT "unoerp_tokens_userId_fkey";

-- DropIndex
DROP INDEX "jobs_unoerpId_key";

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "priorita" TEXT;

-- DropTable
DROP TABLE "unoerp_tokens";

-- CreateTable
CREATE TABLE "unoerp_credentials" (
    "userId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "tokenEncrypted" TEXT NOT NULL,
    "tokenIv" TEXT NOT NULL,
    "lastAuthAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncCount" INTEGER NOT NULL DEFAULT 0,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unoerp_credentials_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_userId_unoerpId_key" ON "jobs"("userId", "unoerpId");

-- AddForeignKey
ALTER TABLE "unoerp_credentials" ADD CONSTRAINT "unoerp_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
