import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { ResumeDto } from '../shared/resume.dto';

interface GeneratePdfDto { resume: ResumeDto; }

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdf: PdfService) {}

  @Post('generate')
  async generate(@Body() dto: GeneratePdfDto, @Res() res: Response): Promise<void> {
    const buf = await this.pdf.generate(dto.resume);
    const name = (dto.resume?.contact?.name || 'resume').replace(/\s+/g, '_').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.pdf"`);
    res.setHeader('Content-Length', String(buf.length));
    res.end(buf);
  }
}
