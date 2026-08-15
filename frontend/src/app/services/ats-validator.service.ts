import { Injectable } from '@angular/core';
import { Resume } from '../models/resume.model';
import { FORBIDDEN_CHARS, STRONG_ACTION_VERBS, WEAK_PHRASES } from '../constants/ats-rules';

export type Severity = 'error' | 'warning' | 'info';

export interface AtsIssue {
  severity: Severity;
  path: string;
  message: string;
}

const STRONG_VERB_SET = new Set(STRONG_ACTION_VERBS.map(v => v.toLowerCase()));
const METRIC_REGEX = /\d/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}$/;

@Injectable({ providedIn: 'root' })
export class AtsValidatorService {
  validate(resume: Resume): AtsIssue[] {
    const issues: AtsIssue[] = [];
    this.checkContact(resume, issues);
    this.checkSummary(resume, issues);
    this.checkSkills(resume, issues);
    this.checkWork(resume, issues);
    this.checkProjects(resume, issues);
    this.checkEducation(resume, issues);
    this.checkForbiddenChars(resume, issues);
    return issues;
  }

  private checkContact(r: Resume, out: AtsIssue[]): void {
    const c = r.contact;
    if (!c.name?.trim()) out.push({ severity: 'error', path: 'contact.name', message: 'Name is required.' });
    if (!c.email?.trim()) out.push({ severity: 'error', path: 'contact.email', message: 'Email is required.' });
    else if (!EMAIL_REGEX.test(c.email.trim()))
      out.push({ severity: 'error', path: 'contact.email', message: 'Email format looks invalid.' });
    if (!c.phone?.trim()) out.push({ severity: 'warning', path: 'contact.phone', message: 'Phone is missing.' });
    if (!c.location?.trim()) out.push({ severity: 'warning', path: 'contact.location', message: 'Location is missing.' });
    if (!c.linkedin?.trim()) out.push({ severity: 'info', path: 'contact.linkedin', message: 'Adding a LinkedIn URL is recommended.' });
    if (!c.github?.trim()) out.push({ severity: 'info', path: 'contact.github', message: 'Adding a GitHub URL is recommended for SDE roles.' });
  }

  private checkSummary(r: Resume, out: AtsIssue[]): void {
    const s = r.summary?.trim() ?? '';
    if (!s) {
      out.push({ severity: 'error', path: 'summary', message: 'Professional summary is empty.' });
      return;
    }
    const sentences = s.split(/[.!?]+/).map(x => x.trim()).filter(Boolean);
    if (sentences.length < 2 || sentences.length > 4) {
      out.push({ severity: 'warning', path: 'summary', message: `Summary should be 2-3 sentences (found ${sentences.length}).` });
    }
    if (s.length > 500) {
      out.push({ severity: 'warning', path: 'summary', message: `Summary is ${s.length} chars; aim for under 500.` });
    }
    if (!METRIC_REGEX.test(s)) {
      out.push({ severity: 'info', path: 'summary', message: 'Summary has no quantified metric (a number strengthens ATS + recruiter signal).' });
    }
    this.flagWeakPhrases(s, 'summary', out);
  }

  private checkSkills(r: Resume, out: AtsIssue[]): void {
    if (!r.skills?.length) {
      out.push({ severity: 'error', path: 'skills', message: 'Skills section is empty.' });
      return;
    }
    const seen = new Map<string, string>();
    for (const group of r.skills) {
      if (!group.category?.trim()) {
        out.push({ severity: 'warning', path: 'skills', message: 'A skills group is missing a category label.' });
      }
      for (const item of group.items ?? []) {
        const key = item.trim().toLowerCase();
        if (!key) continue;
        if (seen.has(key)) {
          out.push({ severity: 'info', path: `skills.${group.category}`, message: `"${item}" is duplicated (also in "${seen.get(key)}").` });
        } else {
          seen.set(key, group.category);
        }
      }
    }
  }

  private checkWork(r: Resume, out: AtsIssue[]): void {
    if (!r.workExperience?.length) {
      out.push({ severity: 'warning', path: 'workExperience', message: 'No work experience entries. Add at least one, or use projects instead.' });
      return;
    }
    r.workExperience.forEach((role, i) => {
      const base = `work[${i}] ${role.company || '?'}`;
      if (!role.company?.trim()) out.push({ severity: 'error', path: base, message: 'Company is required.' });
      if (!role.title?.trim()) out.push({ severity: 'error', path: base, message: 'Title is required.' });
      this.checkDate(role.startDate, `${base}.startDate`, out, false);
      this.checkDate(role.endDate, `${base}.endDate`, out, true);
      this.checkBullets(role.bullets ?? [], base, out);
    });
  }

  private checkProjects(r: Resume, out: AtsIssue[]): void {
    r.projects?.forEach((p, i) => {
      const base = `project[${i}] ${p.name || '?'}`;
      if (!p.name?.trim()) out.push({ severity: 'error', path: base, message: 'Project name is required.' });
      if (!p.techStack?.length) out.push({ severity: 'warning', path: base, message: 'Tech stack is empty.' });
      this.checkBullets(p.bullets ?? [], base, out);
    });
  }

  private checkBullets(bullets: string[], base: string, out: AtsIssue[]): void {
    const cleaned = bullets.map(b => b.trim()).filter(Boolean);
    if (cleaned.length < 4) {
      out.push({ severity: 'warning', path: base, message: `Only ${cleaned.length} bullet(s); aim for 4-6.` });
    }
    if (cleaned.length > 6) {
      out.push({ severity: 'info', path: base, message: `${cleaned.length} bullets; consider trimming to 4-6 to fit one page.` });
    }
    const firstVerbs = new Map<string, number>();
    let bulletsWithoutMetric = 0;
    cleaned.forEach((b, i) => {
      const firstWord = b.split(/\s+/)[0]?.toLowerCase() ?? '';
      if (!STRONG_VERB_SET.has(firstWord)) {
        out.push({ severity: 'warning', path: `${base}.bullet[${i}]`, message: `Starts with "${firstWord}" - use a strong action verb (e.g. Architected, Reduced, Automated).` });
      }
      firstVerbs.set(firstWord, (firstVerbs.get(firstWord) ?? 0) + 1);
      if (!METRIC_REGEX.test(b)) bulletsWithoutMetric++;
      this.flagWeakPhrases(b, `${base}.bullet[${i}]`, out);
      if (b.length > 240) {
        out.push({ severity: 'info', path: `${base}.bullet[${i}]`, message: `Bullet is ${b.length} chars; keep bullets under ~240 chars.` });
      }
    });
    for (const [verb, count] of firstVerbs) {
      if (count > 1 && verb) {
        out.push({ severity: 'warning', path: base, message: `Verb "${verb}" is used to start ${count} bullets; vary your openers.` });
      }
    }
    if (cleaned.length && bulletsWithoutMetric / cleaned.length > 0.5) {
      out.push({ severity: 'info', path: base, message: `${bulletsWithoutMetric}/${cleaned.length} bullets have no quantified metric.` });
    }
  }

  private checkEducation(r: Resume, out: AtsIssue[]): void {
    if (!r.education?.length) {
      out.push({ severity: 'warning', path: 'education', message: 'No education entries.' });
      return;
    }
    r.education.forEach((e, i) => {
      const base = `education[${i}] ${e.institution || '?'}`;
      if (!e.institution?.trim()) out.push({ severity: 'error', path: base, message: 'Institution is required.' });
      if (!e.degree?.trim()) out.push({ severity: 'error', path: base, message: 'Degree is required.' });
      this.checkDate(e.startDate, `${base}.startDate`, out, false);
      this.checkDate(e.endDate, `${base}.endDate`, out, true);
    });
  }

  private checkDate(value: string, path: string, out: AtsIssue[], allowPresent: boolean): void {
    if (!value?.trim()) {
      out.push({ severity: 'error', path, message: 'Date is required.' });
      return;
    }
    if (allowPresent && value.trim().toLowerCase() === 'present') return;
    if (!DATE_REGEX.test(value.trim())) {
      out.push({ severity: 'warning', path, message: `Date "${value}" should be YYYY-MM (rendered as "Mon YYYY").` });
    }
  }

  private flagWeakPhrases(text: string, path: string, out: AtsIssue[]): void {
    const lower = text.toLowerCase();
    for (const phrase of WEAK_PHRASES) {
      if (lower.includes(phrase)) {
        out.push({ severity: 'warning', path, message: `Weak phrase detected: "${phrase}".` });
      }
    }
  }

  private checkForbiddenChars(r: Resume, out: AtsIssue[]): void {
    const blob = JSON.stringify(r);
    for (const rule of FORBIDDEN_CHARS) {
      if (blob.includes(rule.char)) {
        out.push({
          severity: 'warning',
          path: 'document',
          message: `Non-ATS-safe character detected: ${rule.name}. Replace with "${rule.replacement}".`,
        });
      }
    }
  }
}
