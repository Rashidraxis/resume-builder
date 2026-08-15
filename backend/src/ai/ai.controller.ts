import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { ResumeDto } from '../shared/resume.dto';

interface RewriteBulletDto { bullet: string; roleContext: string; }
interface SummaryDto { resume: ResumeDto; targetRole?: string; }
interface GapCheckDto { resume: ResumeDto; jd?: string; }

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('rewrite-bullet')
  rewriteBullet(@Body() dto: RewriteBulletDto) {
    return this.ai.rewriteBullet(dto.bullet ?? '', dto.roleContext ?? '');
  }

  @Post('summary')
  summary(@Body() dto: SummaryDto) {
    return this.ai.generateSummary(dto.resume, dto.targetRole);
  }

  @Post('gap-check')
  gapCheck(@Body() dto: GapCheckDto) {
    return this.ai.gapCheck(dto.resume, dto.jd);
  }
}
