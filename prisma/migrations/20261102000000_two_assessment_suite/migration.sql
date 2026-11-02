ALTER TABLE "Student"
ADD COLUMN "profession" TEXT NOT NULL DEFAULT 'Student',
ADD COLUMN "gender" TEXT NOT NULL DEFAULT 'Prefer not to say',
ADD COLUMN "country" TEXT NOT NULL DEFAULT 'India';

UPDATE "Student" SET "email" = CONCAT('student-', "id", '@example.invalid') WHERE "email" IS NULL;
UPDATE "Student" SET "contactNumber" = '0000000' WHERE "contactNumber" IS NULL;
ALTER TABLE "Student" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "contactNumber" SET NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "profession" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "gender" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "country" DROP DEFAULT;

ALTER TABLE "AssessmentSession" ADD COLUMN "learningStyleIdempotencyKey" TEXT;
CREATE UNIQUE INDEX "AssessmentSession_learningStyleIdempotencyKey_key" ON "AssessmentSession"("learningStyleIdempotencyKey");

ALTER TABLE "AssessmentResult" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'PSYCHOMETRIC';
DROP INDEX "AssessmentResult_sessionId_key";
CREATE UNIQUE INDEX "AssessmentResult_sessionId_kind_key" ON "AssessmentResult"("sessionId", "kind");
ALTER TABLE "AssessmentResult" ALTER COLUMN "kind" DROP DEFAULT;

ALTER TABLE "GeneratedReport" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'PSYCHOMETRIC';
DROP INDEX "GeneratedReport_sessionId_key";
CREATE UNIQUE INDEX "GeneratedReport_sessionId_kind_key" ON "GeneratedReport"("sessionId", "kind");
ALTER TABLE "GeneratedReport" ALTER COLUMN "kind" DROP DEFAULT;
