import { ResumeDto } from '../shared/resume.dto';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function esc(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Collapse any embedded newlines / multiple spaces so bullets render as single-line flow.
function normalize(s: string | undefined | null): string {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function inline(s: string | undefined | null): string {
  return esc(normalize(s)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function fmtDate(value: string | undefined): string {
  if (!value) return '';
  const v = value.trim();
  if (v.toLowerCase() === 'present') return 'Present';
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (!m) return v;
  const idx = parseInt(m[2], 10) - 1;
  return idx >= 0 && idx < 12 ? `${MONTHS[idx]} ${m[1]}` : v;
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function renderList(items: string[]): string {
  const bullets = items
    .map(b => normalize(b))
    .filter(Boolean)
    .map(b => `<li>- ${inline(b)}</li>`)
    .join('');
  return bullets ? `<ul class="doc-list">${bullets}</ul>` : '';
}

export function renderResumeHtml(r: ResumeDto): string {
  const c = r.contact ?? ({} as ResumeDto['contact']);
  const contactBits: string[] = [];
  if (c.email) contactBits.push(esc(c.email));
  if (c.phone) contactBits.push(esc(c.phone));
  if (c.location) contactBits.push(esc(c.location) + (c.openToRelocation ? ' (Open to Relocation)' : ''));

  const links: string[] = [];
  if (c.linkedin) links.push(esc(stripProtocol(c.linkedin)));
  if (c.github) links.push(esc(stripProtocol(c.github)));
  if (c.portfolio) links.push(esc(stripProtocol(c.portfolio)));

  const sections: string[] = [];

  if (r.summary?.trim()) {
    sections.push(`
      <section>
        <h2 class="doc-section">PROFESSIONAL SUMMARY</h2>
        <p class="doc-body">${esc(normalize(r.summary))}</p>
      </section>`);
  }

  if (r.skills?.length) {
    const rows = r.skills
      .filter(g => g.category?.trim() || (g.items?.length))
      .map(g => `<li>- <strong>${esc(g.category)}:</strong> ${esc((g.items ?? []).join(', '))}</li>`)
      .join('');
    if (rows) sections.push(`
      <section>
        <h2 class="doc-section">SKILLS</h2>
        <ul class="doc-list">${rows}</ul>
      </section>`);
  }

  if (r.workExperience?.length) {
    const entries = r.workExperience.map(w => `
      <div class="doc-entry">
        <div class="entry-header"><span class="entry-title">${esc(w.company)}</span></div>
        <div class="entry-row">
          <span class="entry-role">${esc(w.title)}${w.location ? ' | ' + esc(w.location) : ''}</span>
          <span class="entry-date">${esc(fmtDate(w.startDate))} - ${esc(fmtDate(w.endDate))}</span>
        </div>
        ${renderList(w.bullets ?? [])}
      </div>`).join('');
    sections.push(`
      <section>
        <h2 class="doc-section">WORK EXPERIENCE</h2>
        ${entries}
      </section>`);
  }

  if (r.projects?.length) {
    const entries = r.projects.map(p => `
      <div class="doc-entry">
        <div class="entry-header"><span class="entry-title">${esc(p.name)}${p.url ? ' (' + esc(stripProtocol(p.url)) + ')' : ''}</span></div>
        ${p.techStack?.length ? `<div class="entry-row"><span class="entry-role">Tech Stack: ${esc(p.techStack.join(', '))}</span></div>` : ''}
        ${renderList(p.bullets ?? [])}
      </div>`).join('');
    sections.push(`
      <section>
        <h2 class="doc-section">PROJECTS</h2>
        ${entries}
      </section>`);
  }

  if (r.education?.length) {
    const entries = r.education.map(e => `
      <div class="doc-entry">
        <div class="entry-header"><span class="entry-title">${esc(e.institution)}</span></div>
        <div class="entry-row">
          <span class="entry-role">${esc(e.degree)}${e.gpa ? ', CGPA: ' + esc(e.gpa) : ''}</span>
          <span class="entry-date">${esc(fmtDate(e.startDate))} - ${esc(fmtDate(e.endDate))}</span>
        </div>
        ${e.coursework?.length ? `<p class="doc-body">Relevant Coursework: ${esc(e.coursework.join(', '))}</p>` : ''}
      </div>`).join('');
    sections.push(`
      <section>
        <h2 class="doc-section">EDUCATION</h2>
        ${entries}
      </section>`);
  }

  if (r.certifications?.length) {
    const rows = r.certifications
      .map(k => `<li>- ${esc(k.name)} - ${esc(k.issuer)} (${esc(fmtDate(k.date))})</li>`)
      .join('');
    sections.push(`
      <section>
        <h2 class="doc-section">CERTIFICATIONS</h2>
        <ul class="doc-list">${rows}</ul>
      </section>`);
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(c.name || 'Resume')}</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  html, body { margin: 0; padding: 0; color: #111; }
  body {
    font-family: Calibri, Arial, 'Helvetica Neue', sans-serif;
    font-size: 10.5pt;
    line-height: 1.2;
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
  .doc-entry { margin-bottom: 5px; page-break-inside: avoid; }
  .entry-header .entry-title { font-weight: 700; }
  .entry-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-style: italic;
  }
  .entry-date { white-space: nowrap; }
  section { page-break-inside: avoid; }
</style>
</head>
<body>
  <header class="doc-header">
    <h1 class="doc-name">${esc(c.name || 'Your Name')}</h1>
    ${contactBits.length ? `<p class="doc-contact">${contactBits.join(' | ')}</p>` : ''}
    ${links.length ? `<p class="doc-contact">${links.join(' | ')}</p>` : ''}
  </header>
  ${sections.join('\n')}
</body>
</html>`;
}
