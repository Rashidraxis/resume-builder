import { Injectable } from '@angular/core';
import { Resume } from '../models/resume.model';
import { KEYWORD_DICTIONARY } from '../constants/ats-rules';

export interface KeywordMatchResult {
  jdKeywords: string[];
  matched: string[];
  missing: string[];
  score: number; // 0-100
}

@Injectable({ providedIn: 'root' })
export class KeywordMatchService {
  private readonly dictSorted = [...KEYWORD_DICTIONARY].sort((a, b) => b.length - a.length);

  extractFromJd(jd: string): string[] {
    if (!jd?.trim()) return [];
    const haystack = ` ${jd.toLowerCase()} `;
    const found = new Set<string>();
    for (const kw of this.dictSorted) {
      const pattern = this.toBoundedPattern(kw);
      if (pattern.test(haystack)) found.add(kw);
    }
    return [...found].sort();
  }

  match(resume: Resume, jd: string): KeywordMatchResult {
    const jdKeywords = this.extractFromJd(jd);
    if (!jdKeywords.length) {
      return { jdKeywords: [], matched: [], missing: [], score: 0 };
    }
    const resumeText = this.buildResumeText(resume).toLowerCase();
    const haystack = ` ${resumeText} `;
    const matched: string[] = [];
    const missing: string[] = [];
    for (const kw of jdKeywords) {
      if (this.toBoundedPattern(kw).test(haystack)) matched.push(kw);
      else missing.push(kw);
    }
    const score = Math.round((matched.length / jdKeywords.length) * 100);
    return { jdKeywords, matched, missing, score };
  }

  private buildResumeText(r: Resume): string {
    const parts: string[] = [];
    parts.push(r.summary ?? '');
    for (const g of r.skills ?? []) parts.push(g.category, ...(g.items ?? []));
    for (const w of r.workExperience ?? []) {
      parts.push(w.company, w.title, ...(w.bullets ?? []));
    }
    for (const p of r.projects ?? []) {
      parts.push(p.name, ...(p.techStack ?? []), ...(p.bullets ?? []));
    }
    for (const e of r.education ?? []) parts.push(e.institution, e.degree, ...(e.coursework ?? []));
    for (const c of r.certifications ?? []) parts.push(c.name, c.issuer);
    return parts.join(' ');
  }

  private toBoundedPattern(keyword: string): RegExp {
    // Word-boundary matching that tolerates '.', '/', '+', '#' inside terms (node.js, ci/cd, c++, c#).
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
  }
}
