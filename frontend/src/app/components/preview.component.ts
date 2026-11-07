import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeStoreService } from '../services/resume-store.service';
import { Resume } from '../models/resume.model';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(value: string): string {
  if (!value) return '';
  const v = value.trim();
  if (v.toLowerCase() === 'present') return 'Present';
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (!m) return v;
  const monthIdx = parseInt(m[2], 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return v;
  return `${MONTHS[monthIdx]} ${m[1]}`;
}

// Collapse embedded newlines / multiple spaces so bullets render as single-line flow.
function normalize(v: string | undefined | null): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-frame">
      <article class="resume" id="resume-doc">
        <header class="doc-header">
          <h1 class="doc-name">{{ resume().contact.name || 'Your Name' }}</h1>
          <p class="doc-contact">
            <ng-container *ngIf="resume().contact.email">{{ resume().contact.email }}</ng-container>
            <ng-container *ngIf="resume().contact.phone"> | {{ resume().contact.phone }}</ng-container>
            <ng-container *ngIf="resume().contact.location">
              | {{ resume().contact.location }}<ng-container *ngIf="resume().contact.openToRelocation"> (Open to Relocation)</ng-container>
            </ng-container>
          </p>
          <p class="doc-contact" *ngIf="hasLinks()">
            <ng-container *ngIf="resume().contact.linkedin">{{ stripProtocol(resume().contact.linkedin!) }}</ng-container>
            <ng-container *ngIf="resume().contact.github"> | {{ stripProtocol(resume().contact.github!) }}</ng-container>
            <ng-container *ngIf="resume().contact.portfolio"> | {{ stripProtocol(resume().contact.portfolio!) }}</ng-container>
          </p>
        </header>

        <section *ngIf="resume().summary?.trim()">
          <h2 class="doc-section">PROFESSIONAL SUMMARY</h2>
          <p class="doc-body">{{ clean(resume().summary) }}</p>
        </section>

        <section *ngIf="resume().skills?.length">
          <h2 class="doc-section">SKILLS</h2>
          <ul class="doc-list">
            <li *ngFor="let group of resume().skills">
              - <strong>{{ group.category }}:</strong> {{ group.items.join(', ') }}
            </li>
          </ul>
        </section>

        <section *ngIf="resume().workExperience?.length">
          <h2 class="doc-section">WORK EXPERIENCE</h2>
          <div class="doc-entry" *ngFor="let role of resume().workExperience">
            <div class="entry-header">
              <span class="entry-title">{{ role.company }}</span>
            </div>
            <div class="entry-row">
              <span class="entry-role">{{ role.title }}<ng-container *ngIf="role.location"> | {{ role.location }}</ng-container></span>
              <span class="entry-date">{{ fmt(role.startDate) }} - {{ fmt(role.endDate) }}</span>
            </div>
            <ul class="doc-list">
              <li *ngFor="let b of role.bullets">- <span [innerHTML]="format(b)"></span></li>
            </ul>
          </div>
        </section>

        <section *ngIf="resume().projects?.length">
          <h2 class="doc-section">PROJECTS</h2>
          <div class="doc-entry" *ngFor="let p of resume().projects">
            <div class="entry-header">
              <span class="entry-title">{{ p.name }}<ng-container *ngIf="p.url"> ({{ stripProtocol(p.url) }})</ng-container></span>
            </div>
            <div class="entry-row" *ngIf="p.techStack?.length">
              <span class="entry-role">Tech Stack: {{ p.techStack.join(', ') }}</span>
            </div>
            <ul class="doc-list">
              <li *ngFor="let b of p.bullets">- <span [innerHTML]="format(b)"></span></li>
            </ul>
          </div>
        </section>

        <section *ngIf="resume().education?.length">
          <h2 class="doc-section">EDUCATION</h2>
          <div class="doc-entry" *ngFor="let e of resume().education">
            <div class="entry-header">
              <span class="entry-title">{{ e.institution }}</span>
            </div>
            <div class="entry-row">
              <span class="entry-role">
                {{ e.degree }}<ng-container *ngIf="e.gpa">, CGPA: {{ e.gpa }}</ng-container>
              </span>
              <span class="entry-date">{{ fmt(e.startDate) }} - {{ fmt(e.endDate) }}</span>
            </div>
            <p class="doc-body" *ngIf="e.coursework?.length">Relevant Coursework: {{ e.coursework?.join(', ') }}</p>
          </div>
        </section>

        <section *ngIf="resume().certifications?.length">
          <h2 class="doc-section">CERTIFICATIONS</h2>
          <ul class="doc-list">
            <li *ngFor="let c of resume().certifications">
              -
              <a *ngIf="isHttpUrl(c.url ?? c.verificationUrl); else plainCertificationName"
                 [href]="c.url ?? c.verificationUrl" target="_blank" rel="noopener noreferrer">{{ c.name }}</a>
              <ng-template #plainCertificationName>{{ c.name }}</ng-template>
              - {{ c.issuer }} ({{ fmt(c.date) }})
            </li>
          </ul>
        </section>
      </article>
    </div>
  `,
  styles: [`
    .preview-frame {
      background: #eceff3;
      padding: 24px;
      overflow: auto;
      height: 100%;
    }
    .resume {
      background: #fff;
      color: #111;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      font-family: Calibri, Arial, 'Helvetica Neue', sans-serif;
      font-size: 10.5pt;
      line-height: 1.2;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      min-height: 11in;
    }
    .doc-header { text-align: center; margin-bottom: 6px; }
    .doc-name { font-size: 16pt; margin: 0 0 2px; letter-spacing: 0.02em; }
    .doc-contact { margin: 0; font-size: 10pt; }
    .doc-section {
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 8px 0 3px;
      padding-bottom: 1px;
      border-bottom: 1px solid #222;
    }
    .doc-body { margin: 2px 0; }
    .doc-list { list-style: none; padding: 0; margin: 3px 0; }
    .doc-list li { padding-left: 14px; text-indent: -14px; margin: 1px 0; }
    .doc-entry { margin-bottom: 5px; }
    .entry-header .entry-title { font-weight: 700; }
    .entry-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-style: italic;
    }
    .entry-date { white-space: nowrap; }
  `],
})
export class PreviewComponent {
  private readonly store = inject(ResumeStoreService);
  readonly resume = this.store.resume;

  fmt = fmtDate;
  clean = normalize;

  format(value: string): string {
    const escaped = normalize(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  hasLinks = computed(() => {
    const c = this.resume().contact;
    return !!(c.linkedin || c.github || c.portfolio);
  });

  stripProtocol(url: string): string {
    return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  isHttpUrl(value: string | undefined): boolean {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
