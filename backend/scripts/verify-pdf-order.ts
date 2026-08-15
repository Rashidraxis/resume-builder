/**
 * Renders the resume template into a PDF and prints the raw extracted text stream.
 * Used to prove the ATS reading order matches visual / DOM order.
 * Run: npx ts-node scripts/verify-pdf-order.ts
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';
import { PDFParse } from 'pdf-parse';
import { renderResumeHtml } from '../src/pdf/resume-template';
import { ResumeDto } from '../src/shared/resume.dto';

async function main(): Promise<void> {
  const historyPath = join(process.cwd(), 'data', 'history.json');
  const raw = await fs.readFile(historyPath, 'utf8');
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries) || !entries.length) {
    console.error('No history entries found. Save one from the app first.');
    process.exit(1);
  }
  const resume: ResumeDto = entries[0].resume;
  const html = renderResumeHtml(resume);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBytes = await page.pdf({ format: 'Letter', preferCSSPageSize: true });
    const pdfBuffer = Buffer.from(pdfBytes);
    const outPath = join(process.cwd(), 'data', 'verify-output.pdf');
    await fs.writeFile(outPath, pdfBuffer);
    console.log(`Wrote ${outPath} (${pdfBuffer.length} bytes)`);

    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    console.log('----- RAW EXTRACTED TEXT (stream order) -----');
    console.log(result.text);
    console.log('----- END -----');
    console.log(`Pages: ${result.pages?.length ?? 'unknown'}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
