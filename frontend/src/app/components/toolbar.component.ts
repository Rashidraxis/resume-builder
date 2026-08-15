import { Component, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeStoreService } from '../services/resume-store.service';
import { ApiService, HistoryMeta } from '../services/api.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bar">
      <span class="brand">ATS Resume Builder</span>
      <div class="actions">
        <button (click)="saveToServer()" [disabled]="savingHistory()">
          {{ savingHistory() ? 'Saving...' : 'Save to server' }}
        </button>
        <div class="dropdown" #dropdownRoot>
          <button type="button" (click)="toggleDropdown()">
            Load previous <span class="caret">&#9662;</span>
          </button>
          <ul class="menu" *ngIf="dropdownOpen()">
            <li *ngIf="!history().length" class="empty">No saved resumes yet.</li>
            <li *ngFor="let entry of history()">
              <button type="button" class="menu-item" (click)="loadEntry(entry.id)">
                <span class="entry-name">{{ entry.name }}</span>
                <span class="entry-date">{{ formatDate(entry.savedAt) }}</span>
              </button>
            </li>
          </ul>
        </div>
        <button (click)="exportJson()">Export JSON</button>
        <label class="btn">
          Import JSON
          <input type="file" accept="application/json" (change)="importJson($event)" hidden />
        </label>
        <button (click)="downloadPdf()" [disabled]="busy()">
          {{ busy() ? 'Rendering PDF...' : 'Download PDF' }}
        </button>
        <button class="ghost" (click)="reset()">Reset</button>
      </div>
    </div>
    <p class="msg" *ngIf="message()">{{ message() }}</p>
  `,
  styles: [`
    .bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #1c2334; color: #fff; }
    .brand { font-weight: 700; letter-spacing: 0.03em; }
    .actions { display: flex; gap: 8px; align-items: center; }
    button, .btn {
      background: #2554d1; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
    }
    button.ghost { background: transparent; border: 1px solid #ff8e97; color: #ff8e97; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn { display: inline-flex; align-items: center; cursor: pointer; }
    .msg { margin: 0; padding: 6px 16px; background: #fdf2d5; color: #7d5a10; font-size: 12px; }
    .dropdown { position: relative; }
    .caret { font-size: 10px; margin-left: 4px; }
    .menu {
      position: absolute;
      right: 0;
      top: 100%;
      background: #fff;
      color: #1c2334;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      list-style: none;
      margin: 4px 0 0;
      padding: 4px;
      min-width: 240px;
      z-index: 20;
    }
    .menu li { padding: 0; }
    .menu li.empty { padding: 8px 12px; color: #4a5060; font-size: 12px; }
    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      background: transparent;
      color: inherit;
      padding: 6px 10px;
      font-size: 12px;
      text-align: left;
      gap: 12px;
    }
    .menu-item:hover { background: #eef1f7; }
    .entry-date { color: #4a5060; font-size: 11px; white-space: nowrap; }
  `],
})
export class ToolbarComponent implements OnInit {
  private readonly store = inject(ResumeStoreService);
  private readonly api = inject(ApiService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly busy = signal(false);
  readonly savingHistory = signal(false);
  readonly message = signal('');
  readonly history = signal<HistoryMeta[]>([]);
  readonly dropdownOpen = signal(false);

  ngOnInit(): void {
    this.refreshHistory();
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null): void {
    if (!this.dropdownOpen()) return;
    const root = this.host.nativeElement.querySelector('.dropdown');
    if (root && target instanceof Node && root.contains(target)) return;
    this.dropdownOpen.set(false);
  }

  exportJson(): void {
    const blob = new Blob([this.store.exportJson()], { type: 'application/json' });
    this.trigger(blob, 'resume.json');
  }

  importJson(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.store.importJson(String(reader.result ?? ''));
        this.message.set('Imported.');
      } catch (e: any) {
        this.message.set('Import failed: ' + e.message);
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  downloadPdf(): void {
    this.busy.set(true);
    this.message.set('');
    this.api.downloadPdf(this.store.resume()).subscribe({
      next: blob => {
        const name = (this.store.resume().contact.name || 'resume').replace(/\s+/g, '_').toLowerCase();
        this.trigger(blob, `${name}.pdf`);
        this.busy.set(false);
      },
      error: e => {
        this.message.set('PDF failed: ' + e.message + ' (is the backend running?)');
        this.busy.set(false);
      },
    });
  }

  saveToServer(): void {
    this.savingHistory.set(true);
    this.message.set('');
    this.api.saveHistory(this.store.resume()).subscribe({
      next: meta => {
        this.message.set(`Saved "${meta.name}" at ${this.formatDate(meta.savedAt)} (backend keeps the last 3).`);
        this.savingHistory.set(false);
        this.refreshHistory();
      },
      error: e => {
        this.message.set('Save failed: ' + e.message + ' (is the backend running?)');
        this.savingHistory.set(false);
      },
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
    if (this.dropdownOpen()) this.refreshHistory();
  }

  loadEntry(id: string): void {
    this.dropdownOpen.set(false);
    this.api.loadHistory(id).subscribe({
      next: entry => {
        this.store.replace(entry.resume);
        this.message.set(`Loaded "${entry.name}" from ${this.formatDate(entry.savedAt)}.`);
      },
      error: e => this.message.set('Load failed: ' + e.message),
    });
  }

  reset(): void {
    if (confirm('Clear the current resume? This cannot be undone.')) this.store.reset();
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  private refreshHistory(): void {
    this.api.listHistory().subscribe({
      next: list => this.history.set(list),
      error: () => this.history.set([]),
    });
  }

  private trigger(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
}
