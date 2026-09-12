/*
  Warnings:

  - You are about to drop the column `prezzo` on the `sales` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sales" DROP COLUMN "prezzo",
ADD COLUMN     "dataConsegnaPrevista" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "sale_lines" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "descrizione" TEXT NOT NULL,
    "quantita" INTEGER NOT NULL,
    "prezzoUnitario" DOUBLE PRECISION NOT NULL,
    "ordine" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sale_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_lines_saleId_idx" ON "sale_lines"("saleId");

-- AddForeignKey
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
