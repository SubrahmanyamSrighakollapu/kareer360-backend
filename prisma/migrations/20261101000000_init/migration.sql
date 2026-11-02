CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "educationLevel" TEXT NOT NULL,
    "institution" TEXT,
    "city" TEXT NOT NULL,
    "email" TEXT,
    "contactNumber" TEXT,
    "consentConfirmed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentDefinition" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AssessmentDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "statement" TEXT NOT NULL,
    "questionSetVersion" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionMapping" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "facet" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    CONSTRAINT "QuestionMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "assessmentVersion" TEXT NOT NULL,
    "questionSetVersion" TEXT NOT NULL,
    "scoringVersion" TEXT NOT NULL,
    "reportTemplateVersion" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "scoringVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneratedReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "storagePath" TEXT,
    "errorMessage" TEXT,
    "templateVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GeneratedReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentDefinition_version_key" ON "AssessmentDefinition"("version");
CREATE UNIQUE INDEX "AssessmentSession_accessToken_key" ON "AssessmentSession"("accessToken");
CREATE UNIQUE INDEX "AssessmentSession_idempotencyKey_key" ON "AssessmentSession"("idempotencyKey");
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "Answer"("sessionId", "questionId");
CREATE UNIQUE INDEX "AssessmentResult_sessionId_key" ON "AssessmentResult"("sessionId");
CREATE UNIQUE INDEX "GeneratedReport_sessionId_key" ON "GeneratedReport"("sessionId");
CREATE UNIQUE INDEX "GeneratedReport_accessToken_key" ON "GeneratedReport"("accessToken");

ALTER TABLE "Question" ADD CONSTRAINT "Question_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "AssessmentDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionMapping" ADD CONSTRAINT "QuestionMapping_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "AssessmentDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
