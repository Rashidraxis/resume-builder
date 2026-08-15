import { Injectable, InternalServerErrorException, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import { ResumeDto } from '../shared/resume.dto';
import { renderResumeHtml } from './resume-template';

@Injectable()
export class PdfService implements OnModuleDestroy {
  private browserPromise: Promise<Browser> | null = null;

  async generate(resume: ResumeDto): Promise<Buffer> {
    const html = renderResumeHtml(resume);
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: false,
        preferCSSPageSize: true,
      });
      return Buffer.from(pdf);
    } catch (err: any) {
      throw new InternalServerErrorException(`PDF render failed: ${err?.message ?? err}`);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browserPromise;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise) {
      const browser = await this.browserPromise.catch(() => null);
      if (browser) await browser.close().catch(() => undefined);
    }
  }
}
