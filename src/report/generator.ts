import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { renderReport, ReportData } from "./template.js";
export async function generatePdf(data:ReportData,reportId:string){
 const dir=path.resolve(process.env.REPORT_OUTPUT_DIR||"generated-reports");await fs.mkdir(dir,{recursive:true});const output=path.join(dir,`${reportId}.pdf`);
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||undefined,args:["--no-sandbox","--disable-setuid-sandbox"]});
 try{const page=await browser.newPage();await page.setContent(renderReport(data),{waitUntil:"load"});await page.evaluate(()=>document.fonts.ready);await page.pdf({path:output,format:"A4",printBackground:true,preferCSSPageSize:true});return output}finally{await browser.close()}
}

