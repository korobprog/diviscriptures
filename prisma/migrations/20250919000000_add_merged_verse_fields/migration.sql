-- AddMergedVerseFields
ALTER TABLE "verses" ADD COLUMN "isMergedVerse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "verses" ADD COLUMN "mergedWith" TEXT;
ALTER TABLE "verses" ADD COLUMN "mergedBlockId" TEXT;
