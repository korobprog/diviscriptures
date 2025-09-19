-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "readingTime" TEXT,
ADD COLUMN     "joinLink" TEXT,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "maxParticipants" INTEGER NOT NULL DEFAULT 10;
