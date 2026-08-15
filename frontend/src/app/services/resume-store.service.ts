import { Injectable, signal, effect } from '@angular/core';
import { Resume, emptyResume } from '../models/resume.model';

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
    const parsed = JSON.parse(json);
    this.resume.set({ ...emptyResume(), ...parsed });
  }
}
