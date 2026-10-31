import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { renderReferenceReport, ReferenceReportData } from "./referenceTemplate.js";

export function reportPdfFilename(studentName: string, assessmentDate: string, reportId: string) {
  const safeName = studentName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "Student";
  const parsedDate = new Date(assessmentDate);
  const date = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString().slice(0, 10) : parsedDate.toISOString().slice(0, 10);
  return `Kareer360-${safeName}-${date}-${reportId}.pdf`;
}

export async function generateReferencePdf(data: ReferenceReportData, reportId: string) {
  const directory = path.resolve(process.env.REPORT_OUTPUT_DIR || "generated-reports");
  await fs.mkdir(directory, { recursive: true });
  const filename = reportPdfFilename(data.student.fullName, data.assessmentDate, reportId);
  const output = path.join(directory, filename);
  const partial = path.join(directory, `${filename}.partial`);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(renderReferenceReport(data), { waitUntil: "load" });
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0), { timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: partial, format: "A4", printBackground: true, preferCSSPageSize: true });
    await fs.rm(output, { force: true });
    await fs.rename(partial, output);
    return output;
  } catch (error) {
    await fs.rm(partial, { force: true }).catch(() => undefined);
    await fs.rm(output, { force: true }).catch(() => undefined);
    throw error;
  } finally {
    await browser.close();
  }
}
