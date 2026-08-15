import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResumeStoreService } from '../services/resume-store.service';
import { ApiService } from '../services/api.service';
import { Resume } from '../models/resume.model';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="editor">
      <details open>
        <summary>Contact</summary>
        <div class="grid" formGroupName="contact">
          <label>Name<input formControlName="name" placeholder="Full name" /></label>
          <label>Email<input formControlName="email" type="email" placeholder="you@example.com" /></label>
          <label>Phone<input formControlName="phone" placeholder="+91 XXXXXXXXXX" /></label>
          <label>Location<input formControlName="location" placeholder="City, Country" /></label>
          <label class="checkbox">
            <input type="checkbox" formControlName="openToRelocation" /> Open to Relocation
          </label>
          <label>LinkedIn<input formControlName="linkedin" placeholder="https://linkedin.com/in/..." /></label>
          <label>GitHub<input formControlName="github" placeholder="https://github.com/..." /></label>
          <label>Portfolio<input formControlName="portfolio" placeholder="https://..." /></label>
        </div>
      </details>

      <details open>
        <summary>Professional Summary</summary>
        <textarea rows="4" formControlName="summary"
                  placeholder="2-3 sentences. Lead with years of experience, core stack, and 1-2 quantified achievements."></textarea>
        <div class="row-actions">
          <button type="button" (click)="aiSummary()" [disabled]="aiBusy()">AI: rewrite summary</button>
          <span class="hint" *ngIf="aiMessage()">{{ aiMessage() }}</span>
        </div>
      </details>

      <details open>
        <summary>Skills</summary>
        <div formArrayName="skills">
          <div *ngFor="let g of skills.controls; let i = index" [formGroupName]="i" class="card">
            <div class="grid">
              <label>Category<input formControlName="category" placeholder="Languages / Frameworks / Databases..." /></label>
              <label>Items (comma-separated)
                <input [value]="itemsAsString(i)" (input)="setItems(i, $any($event.target).value)"
                       placeholder="Java, TypeScript, SQL" />
              </label>
            </div>
            <button type="button" class="ghost" (click)="skills.removeAt(i)">Remove group</button>
          </div>
        </div>
        <button type="button" (click)="addSkillGroup()">+ Add skill group</button>
      </details>

      <details open>
        <summary>Work Experience</summary>
        <div formArrayName="workExperience">
          <div *ngFor="let w of workExperience.controls; let i = index" [formGroupName]="i" class="card">
            <div class="grid">
              <label>Company<input formControlName="company" /></label>
              <label>Title<input formControlName="title" /></label>
              <label>Location<input formControlName="location" placeholder="City, Country (optional)" /></label>
              <label>Start (YYYY-MM)<input formControlName="startDate" placeholder="2023-10" /></label>
              <label>End (YYYY-MM or Present)<input formControlName="endDate" placeholder="Present" /></label>
            </div>
            <div formArrayName="bullets" class="bullets">
              <div *ngFor="let b of bulletsOf(workExperience, i).controls; let j = index" class="bullet-row">
                <textarea rows="2" [formControlName]="j" placeholder="Start with a strong verb; include a metric where possible."></textarea>
                <div class="bullet-actions">
                  <button type="button" (click)="aiBullet(workExperience, i, j)" [disabled]="aiBusy()">AI</button>
                  <button type="button" class="ghost" (click)="removeBullet(workExperience, i, j)">x</button>
                </div>
              </div>
            </div>
            <div class="row-actions">
              <button type="button" (click)="addBullet(workExperience, i)">+ Add bullet</button>
              <button type="button" class="ghost" (click)="workExperience.removeAt(i)">Remove role</button>
            </div>
          </div>
        </div>
        <button type="button" (click)="addWork()">+ Add role</button>
      </details>

      <details open>
        <summary>Projects</summary>
        <div formArrayName="projects">
          <div *ngFor="let p of projects.controls; let i = index" [formGroupName]="i" class="card">
            <div class="grid">
              <label>Name<input formControlName="name" /></label>
              <label>URL (optional)<input formControlName="url" placeholder="https://..." /></label>
              <label>Tech Stack (comma-separated)
                <input [value]="techAsString(i)" (input)="setTech(i, $any($event.target).value)" />
              </label>
            </div>
            <div formArrayName="bullets" class="bullets">
              <div *ngFor="let b of bulletsOf(projects, i).controls; let j = index" class="bullet-row">
                <textarea rows="2" [formControlName]="j"></textarea>
                <div class="bullet-actions">
                  <button type="button" (click)="aiBullet(projects, i, j)" [disabled]="aiBusy()">AI</button>
                  <button type="button" class="ghost" (click)="removeBullet(projects, i, j)">x</button>
                </div>
              </div>
            </div>
            <div class="row-actions">
              <button type="button" (click)="addBullet(projects, i)">+ Add bullet</button>
              <button type="button" class="ghost" (click)="projects.removeAt(i)">Remove project</button>
            </div>
          </div>
        </div>
        <button type="button" (click)="addProject()">+ Add project</button>
      </details>

      <details>
        <summary>Education</summary>
        <div formArrayName="education">
          <div *ngFor="let e of education.controls; let i = index" [formGroupName]="i" class="card">
            <div class="grid">
              <label>Institution<input formControlName="institution" /></label>
              <label>Degree<input formControlName="degree" placeholder="B.E. in Computer Science" /></label>
              <label>Start (YYYY-MM)<input formControlName="startDate" placeholder="2019-08" /></label>
              <label>End (YYYY-MM)<input formControlName="endDate" placeholder="2023-06" /></label>
              <label>GPA (optional)<input formControlName="gpa" placeholder="8.13/10" /></label>
              <label>Coursework (comma-separated)
                <input [value]="courseworkAsString(i)" (input)="setCoursework(i, $any($event.target).value)" />
              </label>
            </div>
            <button type="button" class="ghost" (click)="education.removeAt(i)">Remove</button>
          </div>
        </div>
        <button type="button" (click)="addEducation()">+ Add education</button>
      </details>

      <details>
        <summary>Certifications</summary>
        <div formArrayName="certifications">
          <div *ngFor="let c of certifications.controls; let i = index" [formGroupName]="i" class="card">
            <div class="grid">
              <label>Name<input formControlName="name" /></label>
              <label>Issuer<input formControlName="issuer" /></label>
              <label>Date (YYYY-MM)<input formControlName="date" /></label>
            </div>
            <button type="button" class="ghost" (click)="certifications.removeAt(i)">Remove</button>
          </div>
        </div>
        <button type="button" (click)="addCert()">+ Add certification</button>
      </details>
    </form>
  `,
  styles: [`
    .editor { padding: 16px; overflow-y: auto; height: 100%; }
    details {
      border: 1px solid #d4d7dd;
      border-radius: 6px;
      margin-bottom: 12px;
      background: #fff;
    }
    summary {
      cursor: pointer;
      padding: 10px 12px;
      font-weight: 600;
      user-select: none;
    }
    details > *:not(summary) { padding: 0 12px 12px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }
    label { display: flex; flex-direction: column; font-size: 12px; color: #4a5060; }
    label.checkbox { flex-direction: row; align-items: center; gap: 6px; font-size: 13px; }
    input, textarea {
      font: inherit;
      border: 1px solid #cfd3db;
      border-radius: 4px;
      padding: 6px 8px;
      background: #fff;
    }
    textarea { resize: vertical; font-family: inherit; }
    .card {
      border: 1px solid #e2e5eb;
      background: #fafbfd;
      border-radius: 6px;
      padding: 10px;
      margin: 10px 0;
    }
    .bullets { margin-top: 8px; }
    .bullet-row { display: grid; grid-template-columns: 1fr auto; gap: 6px; margin-bottom: 6px; }
    .bullet-actions { display: flex; flex-direction: column; gap: 4px; }
    .row-actions { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
    button {
      background: #2554d1;
      color: #fff;
      border: none;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    button.ghost { background: transparent; color: #b02a37; border: 1px solid #e0b4b8; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .hint { color: #4a5060; font-size: 12px; }
  `],
})
export class EditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(ResumeStoreService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly aiBusy = signal(false);
  readonly aiMessage = signal<string>('');

  form: FormGroup = this.fb.group({
    contact: this.fb.group({
      name: [''],
      email: ['', [Validators.email]],
      phone: [''],
      location: [''],
      openToRelocation: [false],
      linkedin: [''],
      github: [''],
      portfolio: [''],
    }),
    summary: [''],
    skills: this.fb.array([]),
    workExperience: this.fb.array([]),
    projects: this.fb.array([]),
    education: this.fb.array([]),
    certifications: this.fb.array([]),
  });

  get skills() { return this.form.get('skills') as FormArray; }
  get workExperience() { return this.form.get('workExperience') as FormArray; }
  get projects() { return this.form.get('projects') as FormArray; }
  get education() { return this.form.get('education') as FormArray; }
  get certifications() { return this.form.get('certifications') as FormArray; }

  constructor() {
    // Push external store changes (e.g. JSON import, AI summary) back into the form.
    effect(() => {
      const r = this.store.resume();
      const current = this.form.getRawValue();
      if (JSON.stringify(current) === JSON.stringify(this.toFormShape(r))) return;
      this.patchFromResume(r);
    });
  }

  ngOnInit(): void {
    this.patchFromResume(this.store.resume());
    this.form.valueChanges.pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.store.replace(this.buildResumeFromForm());
    });
  }

  bulletsOf(arr: FormArray, i: number): FormArray {
    return arr.at(i).get('bullets') as FormArray;
  }

  itemsAsString(i: number): string {
    return (this.skills.at(i).get('items')?.value ?? []).join(', ');
  }
  setItems(i: number, value: string): void {
    this.skills.at(i).patchValue({ items: this.split(value) });
  }
  techAsString(i: number): string {
    return (this.projects.at(i).get('techStack')?.value ?? []).join(', ');
  }
  setTech(i: number, value: string): void {
    this.projects.at(i).patchValue({ techStack: this.split(value) });
  }
  courseworkAsString(i: number): string {
    return (this.education.at(i).get('coursework')?.value ?? []).join(', ');
  }
  setCoursework(i: number, value: string): void {
    this.education.at(i).patchValue({ coursework: this.split(value) });
  }

  addSkillGroup(): void {
    this.skills.push(this.fb.group({ category: [''], items: [[] as string[]] }));
  }

  addWork(): void {
    this.workExperience.push(this.fb.group({
      company: [''], title: [''], location: [''],
      startDate: [''], endDate: ['Present'],
      bullets: this.fb.array([this.fb.control('')]),
    }));
  }

  addProject(): void {
    this.projects.push(this.fb.group({
      name: [''], url: [''], techStack: [[] as string[]],
      bullets: this.fb.array([this.fb.control('')]),
    }));
  }

  addEducation(): void {
    this.education.push(this.fb.group({
      institution: [''], degree: [''],
      startDate: [''], endDate: [''],
      gpa: [''], coursework: [[] as string[]],
    }));
  }

  addCert(): void {
    this.certifications.push(this.fb.group({ name: [''], issuer: [''], date: [''] }));
  }

  addBullet(arr: FormArray, i: number): void {
    (arr.at(i).get('bullets') as FormArray).push(this.fb.control(''));
  }
  removeBullet(arr: FormArray, i: number, j: number): void {
    (arr.at(i).get('bullets') as FormArray).removeAt(j);
  }

  aiSummary(): void {
    this.aiBusy.set(true);
    this.aiMessage.set('');
    this.api.generateSummary(this.buildResumeFromForm()).subscribe({
      next: r => {
        this.form.patchValue({ summary: r.summary });
        this.aiBusy.set(false);
      },
      error: e => { this.aiMessage.set(e.message); this.aiBusy.set(false); },
    });
  }

  aiBullet(arr: FormArray, i: number, j: number): void {
    const control = (arr.at(i).get('bullets') as FormArray).at(j) as FormControl<string>;
    const current = control.value ?? '';
    if (!current.trim()) { this.aiMessage.set('Write a rough bullet first, then AI will refine it.'); return; }
    const roleContext = JSON.stringify(arr.at(i).value);
    this.aiBusy.set(true);
    this.aiMessage.set('');
    this.api.rewriteBullet(current, roleContext).subscribe({
      next: r => {
        if (r.variants?.[0]) control.setValue(r.variants[0]);
        this.aiMessage.set(r.variants?.length > 1 ? `Alternative: ${r.variants[1]}` : '');
        this.aiBusy.set(false);
      },
      error: e => { this.aiMessage.set(e.message); this.aiBusy.set(false); },
    });
  }

  private split(value: string): string[] {
    return value.split(',').map(x => x.trim()).filter(Boolean);
  }

  private patchFromResume(r: Resume): void {
    this.skills.clear();
    this.workExperience.clear();
    this.projects.clear();
    this.education.clear();
    this.certifications.clear();

    this.form.patchValue({
      contact: r.contact,
      summary: r.summary,
    }, { emitEvent: false });

    for (const g of r.skills ?? []) {
      this.skills.push(this.fb.group({
        category: [g.category],
        items: [g.items ?? []],
      }), { emitEvent: false });
    }
    for (const w of r.workExperience ?? []) {
      this.workExperience.push(this.fb.group({
        company: [w.company], title: [w.title], location: [w.location ?? ''],
        startDate: [w.startDate], endDate: [w.endDate],
        bullets: this.fb.array((w.bullets ?? []).map(b => this.fb.control(b))),
      }), { emitEvent: false });
    }
    for (const p of r.projects ?? []) {
      this.projects.push(this.fb.group({
        name: [p.name], url: [p.url ?? ''], techStack: [p.techStack ?? []],
        bullets: this.fb.array((p.bullets ?? []).map(b => this.fb.control(b))),
      }), { emitEvent: false });
    }
    for (const e of r.education ?? []) {
      this.education.push(this.fb.group({
        institution: [e.institution], degree: [e.degree],
        startDate: [e.startDate], endDate: [e.endDate],
        gpa: [e.gpa ?? ''], coursework: [e.coursework ?? []],
      }), { emitEvent: false });
    }
    for (const c of r.certifications ?? []) {
      this.certifications.push(this.fb.group({
        name: [c.name], issuer: [c.issuer], date: [c.date],
      }), { emitEvent: false });
    }
  }

  private buildResumeFromForm(): Resume {
    return this.form.getRawValue() as Resume;
  }

  private toFormShape(r: Resume): unknown {
    return {
      contact: r.contact,
      summary: r.summary,
      skills: r.skills,
      workExperience: r.workExperience,
      projects: r.projects,
      education: r.education,
      certifications: r.certifications,
    };
  }
}
