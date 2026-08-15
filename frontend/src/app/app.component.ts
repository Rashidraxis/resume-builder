import { Component } from '@angular/core';
import { EditorComponent } from './components/editor.component';
import { PreviewComponent } from './components/preview.component';
import { GapCheckComponent } from './components/gap-check.component';
import { JdMatcherComponent } from './components/jd-matcher.component';
import { ToolbarComponent } from './components/toolbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToolbarComponent, EditorComponent, PreviewComponent, GapCheckComponent, JdMatcherComponent],
  template: `
    <app-toolbar />
    <main class="layout">
      <section class="col editor-col"><app-editor /></section>
      <section class="col preview-col"><app-preview /></section>
      <aside class="col side-col">
        <div class="side-half"><app-gap-check /></div>
        <div class="side-half"><app-jd-matcher /></div>
      </aside>
    </main>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100vh; }
    .layout {
      display: grid;
      grid-template-columns: minmax(340px, 1fr) minmax(520px, 1.4fr) minmax(320px, 1fr);
      flex: 1;
      min-height: 0;
      background: #f4f6fa;
    }
    .col { min-height: 0; border-right: 1px solid #dde1e8; background: #f7f8fb; display: flex; flex-direction: column; }
    .col:last-child { border-right: none; }
    .editor-col { background: #fff; }
    .side-col { display: flex; flex-direction: column; }
    .side-half { flex: 1; min-height: 0; border-bottom: 1px solid #dde1e8; overflow: hidden; }
    .side-half:last-child { border-bottom: none; }
    @media (max-width: 1200px) {
      .layout { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr auto; }
      .side-col { grid-column: 1 / -1; flex-direction: row; }
      .side-half { flex: 1; border-bottom: none; border-right: 1px solid #dde1e8; }
    }
  `],
})
export class AppComponent {}
