import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeywordMatchService } from '../services/keyword-match.service';
import { ResumeStoreService } from '../services/resume-store.service';

@Component({
  selector: 'app-jd-matcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel">
      <div class="head">
        <span>Job Description Match</span>
        <span class="score" *ngIf="match().jdKeywords.length" [class.high]="match().score >= 75" [class.mid]="match().score >= 50 && match().score < 75" [class.low]="match().score < 50">
          {{ match().score }}%
        </span>
      </div>
      <textarea rows="6" [(ngModel)]="jd" placeholder="Paste the target job description here to score keyword match."></textarea>
      <div class="results" *ngIf="match().jdKeywords.length">
        <div class="col">
          <h4>Matched ({{ match().matched.length }})</h4>
          <div class="chips">
            <span class="chip ok" *ngFor="let k of match().matched">{{ k }}</span>
          </div>
        </div>
        <div class="col">
          <h4>Missing ({{ match().missing.length }})</h4>
          <div class="chips">
            <span class="chip miss" *ngFor="let k of match().missing">{{ k }}</span>
          </div>
          <p class="hint" *ngIf="match().missing.length">Only add missing keywords you actually have experience with - do not keyword-stuff.</p>
        </div>
      </div>
      <p class="hint" *ngIf="jd() && !match().jdKeywords.length">
        No known SDE keywords detected in the JD. Try a longer JD or a technical role description.
      </p>
    </div>
  `,
  styles: [`
    .panel { padding: 12px 14px; overflow-y: auto; height: 100%; display: flex; flex-direction: column; }
    .head { display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: 8px; }
    .score { font-size: 15px; font-weight: 700; padding: 2px 8px; border-radius: 12px; }
    .score.high { background: #dff4e2; color: #226432; }
    .score.mid { background: #fdf2d5; color: #7d5a10; }
    .score.low { background: #fce4e6; color: #a02233; }
    textarea { font: inherit; border: 1px solid #cfd3db; border-radius: 4px; padding: 8px; resize: vertical; min-height: 100px; }
    .results { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
    h4 { margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #4a5060; }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip { padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 500; }
    .chip.ok { background: #dff4e2; color: #226432; }
    .chip.miss { background: #fce4e6; color: #a02233; }
    .hint { color: #4a5060; font-size: 11px; margin-top: 4px; }
    @media (max-width: 900px) { .results { grid-template-columns: 1fr; } }
  `],
})
export class JdMatcherComponent {
  private readonly kw = inject(KeywordMatchService);
  private readonly store = inject(ResumeStoreService);

  readonly jd = signal<string>('');
  readonly match = computed(() => this.kw.match(this.store.resume(), this.jd()));
}
