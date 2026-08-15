import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ResumeDto } from '../shared/resume.dto';

const DEFAULT_MODEL = 'claude-sonnet-4-5';

const SYSTEM_RULES = `You are an expert technical resume writer and ATS optimization specialist.
Every response you produce MUST follow these rules:
- Use strong action verbs (Architected, Engineered, Optimized, Reduced, Automated, Designed, Led, etc.) and never repeat the same opening verb within a group of bullets.
- Follow a "did X, using Y, resulting in Z" structure whenever the source content supports it.
- Preserve any quantified metric (%, time, scale, users, cost) that appears in the source. NEVER invent numbers, tools, companies, or achievements that are not in the source. If a metric is missing, leave it out; do not guess.
- No fluff phrases: "responsible for", "worked on", "helped with", "team player", "hardworking".
- Use plain ASCII only. No em/en dashes, smart quotes, bullet characters, or emojis.
- Keep bullets under ~240 characters.
- Respond with valid JSON only. No prose, no markdown code fences.`;

@Injectable()
export class AiService {
  private readonly client: Anthropic | null;
  private readonly model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    this.client = key ? new Anthropic({ apiKey: key }) : null;
  }

  private ensureClient(): Anthropic {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI is not configured. Set ANTHROPIC_API_KEY in backend/.env and restart the backend.',
      );
    }
    return this.client;
  }

  async rewriteBullet(bullet: string, roleContext: string): Promise<{ variants: string[] }> {
    const prompt = `Rewrite the following resume bullet to be ATS-optimized while staying strictly grounded in the source (do NOT invent facts or metrics).
Return exactly this JSON: {"variants":["<option 1>","<option 2>"]}.

Role context (JSON):
${this.truncate(roleContext, 2000)}

Original bullet:
"${bullet}"`;
    const json = await this.callJson(prompt);
    const variants = Array.isArray(json?.variants) ? json.variants.filter((v: unknown) => typeof v === 'string') : [];
    if (!variants.length) throw new InternalServerErrorException('AI returned no valid variants.');
    return { variants };
  }

  async generateSummary(resume: ResumeDto, targetRole?: string): Promise<{ summary: string }> {
    const prompt = `Write a professional summary (2-3 sentences, under 500 chars) for this resume. Lead with years of experience, core stack, and 1-2 quantified achievements that appear in the resume.
${targetRole ? `Target role: ${targetRole}\n` : ''}Return exactly this JSON: {"summary":"..."}.

Resume (JSON):
${this.truncate(JSON.stringify(resume), 6000)}`;
    const json = await this.callJson(prompt);
    if (typeof json?.summary !== 'string' || !json.summary.trim()) {
      throw new InternalServerErrorException('AI returned no summary.');
    }
    return { summary: json.summary };
  }

  async gapCheck(resume: ResumeDto, jd?: string): Promise<{ gaps: string[]; followUps: string[] }> {
    const prompt = `Analyze this resume for gaps against SDE hiring standards${jd ? ' and the provided job description' : ''}. Return valid JSON: {"gaps":["..."],"followUps":["..."]}.
- "gaps": specific, concrete issues (missing metrics, weak bullets, generic phrasing, format problems). Reference bullets/sections precisely.
- "followUps": short questions to ask the candidate to strengthen the resume.
${jd ? `\nJob description:\n${this.truncate(jd, 4000)}\n` : ''}
Resume (JSON):
${this.truncate(JSON.stringify(resume), 6000)}`;
    const json = await this.callJson(prompt);
    return {
      gaps: Array.isArray(json?.gaps) ? json.gaps.filter((v: unknown) => typeof v === 'string') : [],
      followUps: Array.isArray(json?.followUps) ? json.followUps.filter((v: unknown) => typeof v === 'string') : [],
    };
  }

  private async callJson(userPrompt: string): Promise<any> {
    const client = this.ensureClient();
    const response = await client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: SYSTEM_RULES,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const text = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map(c => c.text)
      .join('\n')
      .trim();
    return this.parseJson(text);
  }

  private parseJson(raw: string): any {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { /* fallthrough */ }
      }
      throw new InternalServerErrorException('AI response was not valid JSON.');
    }
  }

  private truncate(s: string, max: number): string {
    return s.length <= max ? s : s.slice(0, max) + '...';
  }
}
