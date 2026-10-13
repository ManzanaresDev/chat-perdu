-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('PERDU', 'TROUVE', 'RETROUVE', 'CLOS');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('EN_ATTENTE', 'APPROUVEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMELLE', 'INCONNU');

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "status" "AdStatus" NOT NULL,
    "moderation" "ModerationStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "catName" TEXT,
    "sex" "Sex" NOT NULL DEFAULT 'INCONNU',
    "color" TEXT NOT NULL,
    "ageApprox" TEXT,
    "isTattooed" BOOLEAN NOT NULL DEFAULT false,
    "hasChip" BOOLEAN NOT NULL DEFAULT false,
    "isCollared" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "approxRadiusM" INTEGER NOT NULL DEFAULT 500,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "manageTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ad_manageTokenHash_key" ON "Ad"("manageTokenHash");

-- CreateIndex
CREATE INDEX "Ad_status_moderation_createdAt_idx" ON "Ad"("status", "moderation", "createdAt");

-- CreateIndex
CREATE INDEX "Ad_city_idx" ON "Ad"("city");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
