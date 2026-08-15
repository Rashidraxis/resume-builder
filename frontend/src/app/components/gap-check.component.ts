import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtsIssue, AtsValidatorService } from '../services/ats-validator.service';
import { ResumeStoreService } from '../services/resume-store.service';

@Component({
  selector: 'app-gap-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel">
      <div class="panel-head">
        <span>ATS Gap Check</span>
        <span class="stats">
          <span class="pill error" *ngIf="counts().error">{{ counts().error }} error</span>
          <span class="pill warn" *ngIf="counts().warning">{{ counts().warning }} warn</span>
          <span class="pill info" *ngIf="counts().info">{{ counts().info }} info</span>
          <span class="pill ok" *ngIf="!issues().length">All checks pass</span>
        </span>
      </div>
      <ul class="issue-list">
        <li *ngFor="let issue of issues()" [class]="issue.severity">
          <span class="tag">{{ issue.severity }}</span>
          <span class="path">{{ issue.path }}</span>
          <span class="msg">{{ issue.message }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .panel { padding: 12px 14px; overflow-y: auto; height: 100%; }
    .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 600; }
    .stats { display: flex; gap: 6px; }
    .pill { font-size: 11px; padding: 2px 6px; border-radius: 10px; font-weight: 500; }
    .pill.error { background: #fce4e6; color: #a02233; }
    .pill.warn { background: #fdf2d5; color: #7d5a10; }
    .pill.info { background: #e2edff; color: #24487a; }
    .pill.ok { background: #dff4e2; color: #226432; }
    .issue-list { list-style: none; padding: 0; margin: 0; }
    .issue-list li { display: grid; grid-template-columns: 60px 1fr; gap: 6px 10px; padding: 6px 8px; border-radius: 4px; font-size: 12px; margin-bottom: 4px; align-items: baseline; }
    .issue-list li.error { background: #fdf1f2; }
    .issue-list li.warning { background: #fbf5e5; }
    .issue-list li.info { background: #f0f5fd; }
    .tag { font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
    .path { grid-row: 1; grid-column: 2; font-family: 'Consolas', monospace; color: #4a5060; font-size: 11px; }
    .msg { grid-column: 2; grid-row: 2; }
  `],
})
export class GapCheckComponent {
  private readonly validator = inject(AtsValidatorService);
  private readonly store = inject(ResumeStoreService);

  readonly issues = computed<AtsIssue[]>(() => this.validator.validate(this.store.resume()));
  readonly counts = computed(() => {
    const c = { error: 0, warning: 0, info: 0 };
    for (const i of this.issues()) c[i.severity]++;
    return c;
  });
}
