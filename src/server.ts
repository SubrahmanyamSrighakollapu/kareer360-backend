import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Prisma, PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import { questions } from "./data/questions.js";
import { VERSIONS, type AssessmentResult, type StudentDetails } from "./domain.js";
import { scoreAssessment } from "./scoring/engine.js";
import { answersSchema, studentSchema, submitSchema } from "./validation.js";
import { generateReferencePdf } from "./report/referenceGenerator.js";
import { renderReferenceReport } from "./report/referenceTemplate.js";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 4000);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "128kb" }));

const randomToken = () => crypto.randomBytes(24).toString("base64url");
const bearer = (req: express.Request) =>
  req.headers.authorization?.replace(/^Bearer\s+/i, "") || String(req.query.token || "");
const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const studentResponse = (student: {
  fullName: string;
  dateOfBirth: Date;
  educationLevel: string;
  institution: string | null;
  city: string;
  email: string | null;
  contactNumber: string | null;
  consentConfirmed: boolean;
}): StudentDetails => ({
  fullName: student.fullName,
  dateOfBirth: student.dateOfBirth.toISOString().slice(0, 10),
  educationLevel: student.educationLevel,
  institution: student.institution || undefined,
  city: student.city,
  email: student.email || undefined,
  contactNumber: student.contactNumber || undefined,
  consentConfirmed: student.consentConfirmed,
});

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "ok", versions: VERSIONS });
});

app.post("/api/assessments/start", async (req, res) => {
  const student = studentSchema.parse(req.body);
  const definition = await prisma.assessmentDefinition.findUnique({
    where: { version: VERSIONS.assessment },
  });
  if (!definition) {
    return res.status(503).json({
      error: { code: "ASSESSMENT_UNAVAILABLE", message: "Assessment configuration is unavailable" },
    });
  }
  const session = await prisma.assessmentSession.create({
    data: {
      accessToken: randomToken(),
      assessmentVersion: VERSIONS.assessment,
      questionSetVersion: VERSIONS.questions,
      scoringVersion: VERSIONS.scoring,
      reportTemplateVersion: VERSIONS.report,
      definition: { connect: { id: definition.id } },
      student: {
        create: {
          ...student,
          dateOfBirth: new Date(`${student.dateOfBirth}T00:00:00.000Z`),
          institution: student.institution || null,
          email: student.email || null,
          contactNumber: student.contactNumber || null,
        },
      },
    },
    include: { student: true },
  });
  res.status(201).json({
    sessionId: session.id,
    accessToken: session.accessToken,
    student: studentResponse(session.student),
    questions,
    answers: {},
    versions: VERSIONS,
  });
});

app.get("/api/assessments/:id", async (req, res) => {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: req.params.id },
    include: { student: true, answers: true },
  });
  if (!session || !safeEqual(session.accessToken, bearer(req))) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Assessment session not found" } });
  }
  res.json({
    sessionId: session.id,
    student: studentResponse(session.student),
    questions,
    answers: Object.fromEntries(session.answers.map((answer) => [answer.questionId, answer.value])),
    status: session.status,
  });
});

app.put("/api/assessments/:id/answers", async (req, res) => {
  const session = await prisma.assessmentSession.findUnique({ where: { id: req.params.id } });
  if (!session || !safeEqual(session.accessToken, bearer(req))) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Assessment session not found" } });
  }
  if (session.status !== "IN_PROGRESS") {
    return res.status(409).json({ error: { code: "ALREADY_SUBMITTED", message: "This assessment has already been submitted" } });
  }
  const { answers } = answersSchema.parse(req.body);
  await prisma.$transaction(
    answers.map((answer) =>
      prisma.answer.upsert({
        where: { sessionId_questionId: { sessionId: session.id, questionId: answer.questionId } },
        update: { value: answer.value },
        create: { sessionId: session.id, questionId: answer.questionId, value: answer.value },
      }),
    ),
  );
  const answered = await prisma.answer.count({ where: { sessionId: session.id } });
  res.json({ saved: true, answered });
});

app.post("/api/assessments/:id/submit", async (req, res) => {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: req.params.id },
    include: { answers: true, report: true, student: true },
  });
  if (!session || !safeEqual(session.accessToken, bearer(req))) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Assessment session not found" } });
  }
  const { idempotencyKey } = submitSchema.parse(req.body);
  if (session.status === "SUBMITTED") {
    if (session.idempotencyKey !== idempotencyKey) {
      return res.status(409).json({ error: { code: "ALREADY_SUBMITTED", message: "This assessment has already been submitted" } });
    }
    return res.json({
      reportId: session.report?.id,
      reportToken: session.report?.accessToken,
      status: session.report?.status || "GENERATING",
    });
  }
  const answerMap = new Map(session.answers.map((answer) => [answer.questionId, answer.value]));
  const values = questions.map((question) => answerMap.get(question.id));
  if (values.some((value) => value === undefined)) {
    return res.status(422).json({
      error: {
        code: "INCOMPLETE_ASSESSMENT",
        message: "Answer all 80 questions before submitting",
        details: { answered: session.answers.length },
      },
    });
  }
  const result = scoreAssessment(values as number[]);
  const reportToken = randomToken();
  const submitted = await prisma.$transaction(async (tx) => {
    const updated = await tx.assessmentSession.updateMany({
      where: { id: session.id, status: "IN_PROGRESS" },
      data: { status: "SUBMITTED", idempotencyKey, submittedAt: new Date() },
    });
    if (updated.count !== 1) return null;
    await tx.assessmentResult.create({
      data: {
        sessionId: session.id,
        snapshot: result as unknown as Prisma.InputJsonValue,
        scoringVersion: VERSIONS.scoring,
      },
    });
    return tx.generatedReport.create({
      data: {
        sessionId: session.id,
        accessToken: reportToken,
        status: "GENERATING",
        templateVersion: VERSIONS.report,
      },
    });
  });
  if (!submitted) {
    return res.status(409).json({ error: { code: "ALREADY_SUBMITTED", message: "This assessment has already been submitted" } });
  }
  void generateReferencePdf(
    { student: studentResponse(session.student), result, assessmentDate: new Date().toISOString() },
    submitted.id,
  )
    .then((storagePath) =>
      prisma.generatedReport.update({ where: { id: submitted.id }, data: { storagePath, status: "READY", errorMessage: null } }),
    )
    .catch((error) =>
      prisma.generatedReport.update({
        where: { id: submitted.id },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "PDF generation failed" },
      }),
    );
  res.status(202).json({ reportId: submitted.id, reportToken, status: submitted.status });
});

const loadReport = async (id: string, token: string) => {
  const report = await prisma.generatedReport.findUnique({
    where: { id },
    include: { session: { include: { student: true, result: true } } },
  });
  return report && safeEqual(report.accessToken, token) ? report : null;
};

app.get("/api/reports/:id/status", async (req, res) => {
  const report = await loadReport(req.params.id, bearer(req));
  if (!report) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not found" } });
  res.json({ reportId: report.id, status: report.status, error: report.errorMessage || undefined });
});

app.post("/api/reports/:id/retry", async (req, res) => {
  const report = await loadReport(req.params.id, bearer(req));
  if (!report) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not found" } });
  if (report.status === "GENERATING") return res.status(202).json({ reportId: report.id, status: report.status });
  if (!report.session.result) {
    return res.status(409).json({ error: { code: "RESULT_UNAVAILABLE", message: "Saved report data is unavailable" } });
  }
  await prisma.generatedReport.update({ where: { id: report.id }, data: { status: "GENERATING", errorMessage: null } });
  const result = report.session.result.snapshot as unknown as AssessmentResult;
  void generateReferencePdf(
    { student: studentResponse(report.session.student), result, assessmentDate: report.session.createdAt.toISOString() },
    report.id,
  )
    .then((storagePath) =>
      prisma.generatedReport.update({ where: { id: report.id }, data: { storagePath, status: "READY", errorMessage: null } }),
    )
    .catch((error) =>
      prisma.generatedReport.update({
        where: { id: report.id },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "PDF generation failed" },
      }),
    );
  res.status(202).json({ reportId: report.id, status: "GENERATING" });
});

app.get("/api/reports/:id/preview", async (req, res) => {
  const report = await loadReport(req.params.id, bearer(req));
  if (!report) return res.status(404).send("Report not found");
  if (!report.session.result) return res.status(409).send("Report data unavailable");
  res.type("html").send(
    renderReferenceReport({
      student: studentResponse(report.session.student),
      result: report.session.result.snapshot as unknown as AssessmentResult,
      assessmentDate: report.session.createdAt.toISOString(),
    }),
  );
});

app.get("/api/reports/:id/download", async (req, res) => {
  const report = await loadReport(req.params.id, bearer(req));
  if (!report) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not found" } });
  if (report.status !== "READY" || !report.storagePath || !fs.existsSync(report.storagePath)) {
    return res.status(409).json({ error: { code: "NOT_READY", message: "Report is not ready" } });
  }
  res.download(report.storagePath, path.basename(report.storagePath));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Please check the submitted information", details: err.flatten() },
    });
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Your saved answers are safe." } });
});

const server = app.listen(port, "127.0.0.1", () => console.log(`Kareer360 API listening on 127.0.0.1:${port}`));
const shutdown = () => server.close(() => void prisma.$disconnect().finally(() => process.exit(0)));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
