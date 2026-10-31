import { Injectable, signal, effect } from '@angular/core';
import { Resume, ResumeImport, emptyResume } from '../models/resume.model';

const STORAGE_KEY = 'resume-builder:current';

@Injectable({ providedIn: 'root' })
export class ResumeStoreService {
  readonly resume = signal<Resume>(this.load());

  constructor() {
    effect(() => {
      const snapshot = this.resume();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Storage unavailable (private mode, quota) - ignore silently.
      }
    });
  }

  private load(): Resume {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyResume();
      const parsed = JSON.parse(raw);
      return { ...emptyResume(), ...parsed };
    } catch {
      return emptyResume();
    }
  }

  replace(resume: Resume): void {
    this.resume.set(resume);
  }

  reset(): void {
    this.resume.set(emptyResume());
  }

  exportJson(): string {
    return JSON.stringify(this.resume(), null, 2);
  }

  importJson(json: string): void {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('JSON must contain an object.');
    }

    const value = parsed as Record<string, unknown>;
    if ('experience' in value || this.isSkillMap(value['skills']) || ('contact' in value && !('workExperience' in value))) {
      this.resume.set(this.normalizeImport(value as ResumeImport));
      return;
    }

    this.resume.set({ ...emptyResume(), ...(parsed as Partial<Resume>) });
  }

  private normalizeImport(input: ResumeImport): Resume {
    return {
      ...emptyResume(),
      contact: {
        ...emptyResume().contact,
        name: this.stringValue(input.contact?.name),
        email: this.stringValue(input.contact?.email),
        phone: this.stringValue(input.contact?.phone),
        location: this.stringValue(input.contact?.location),
        openToRelocation: input.contact?.openToRelocation === true,
        linkedin: this.stringValue(input.contact?.linkedin),
        github: this.stringValue(input.contact?.github),
        portfolio: this.stringValue(input.contact?.portfolio),
      },
      summary: this.stringValue(input.summary),
      skills: Object.entries(input.skills ?? {}).map(([category, items]) => ({
        category,
        items: Array.isArray(items) ? items.map(item => this.stringValue(item)).filter(Boolean) : this.split(items),
      })),
      workExperience: (input.experience ?? []).map(experience => {
        const [startDate, endDate] = this.parseDates(experience.dates);
        return {
          company: this.stringValue(experience.company),
          title: this.stringValue(experience.title),
          location: this.stringValue(experience.location),
          startDate,
          endDate,
          bullets: this.stringArray(experience.bullets),
        };
      }),
      projects: (input.projects ?? []).map(project => ({
        name: this.stringValue(project.name),
        url: this.stringValue(project.link),
        techStack: Array.isArray(project.techStack) ? this.stringArray(project.techStack) : this.split(project.techStack),
        bullets: this.stringArray(project.bullets),
      })),
      education: (input.education ?? []).map(education => {
        const [startDate, endDate] = this.parseDates(education.dates);
        return {
          institution: this.stringValue(education.institution),
          degree: this.stringValue(education.degree),
          startDate,
          endDate,
          gpa: '',
          coursework: [],
        };
      }),
    };
  }

  private isSkillMap(value: unknown): value is Record<string, string[] | string> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private parseDates(value: string | undefined): [string, string] {
    const parts = this.stringValue(value).split(/\s+(?:-|–|—|to)\s+/i).filter(Boolean);
    return [parts[0] ?? '', parts[1] ?? (parts[0] ? 'Present' : '')];
  }

  private split(value: unknown): string[] {
    return this.stringValue(value).split(',').map(item => item.trim()).filter(Boolean);
  }

  private stringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map(item => this.stringValue(item)).filter(Boolean) : [];
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
