# ATS Resume Builder

A local, ATS-friendly resume builder for Software Development Engineer roles. Built as an Angular
(standalone components + signals) frontend with a NestJS backend for AI assistance and PDF export.

## What it does

- **Structured editor** for contact, summary, skills, work experience, projects, education, certifications.
- **Live preview** in the same ATS-safe layout used for the PDF export.
- **Rule-based ATS gap check**: flags weak verbs, duplicate opening verbs, missing metrics, bad date
  formats, forbidden Unicode characters (smart quotes, em/en dashes, bullet chars), and section-level
  issues.
- **JD keyword matcher**: paste a job description, get a match score plus matched / missing keyword
  chips. Match uses a curated SDE hard-skill vocabulary.
- **AI assist (optional)** via Anthropic Claude:
  - Rewrite an individual bullet with strong verbs / "did X using Y resulting in Z" structure.
  - Generate a professional summary from your current resume data.
  - LLM-based gap-check that references your actual content.
  All AI is opt-in - if you do not set `ANTHROPIC_API_KEY`, AI endpoints return 503 and the rest of
  the app still works.
- **PDF export** (server-side Puppeteer -> text-selectable, single-column, Calibri) that mirrors the
  in-app preview.
- **Local persistence** (localStorage) with JSON import / export. No accounts, no database.

## Repository layout

```
resume-builder/
  frontend/   Angular 19 SPA (standalone components, signals, reactive forms)
  backend/    NestJS 10 API (ai + pdf modules, ConfigModule, Puppeteer)
```

Storage is local browser only (localStorage). PostgreSQL is **not** used by the MVP but the NestJS
backend is set up so a persistence module can be added later (shared templates, versioning).

## Requirements

- Node.js 20+ (tested on 24.5)
- npm 10+
- ~500 MB free disk (Puppeteer downloads Chromium on first install)
- (Optional) Anthropic API key for AI features

## Setup

```powershell
# Backend
cd backend
npm install
Copy-Item .env.example .env
# Edit backend\.env and paste your ANTHROPIC_API_KEY (optional).

# Frontend
cd ..\frontend
npm install
```

## Run

Two terminals:

```powershell
# Terminal 1 - backend on http://localhost:3000
cd backend
npm run start:dev
```

```powershell
# Terminal 2 - frontend on http://localhost:4200 (proxied /api -> :3000)
cd frontend
npm start
```

Open http://localhost:4200.

## Environment variables (backend)

| Var | Purpose | Default |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Enables AI endpoints. Leave blank to disable AI. | (unset) |
| `ANTHROPIC_MODEL`   | Override Claude model id. | `claude-sonnet-4-5` |
| `PORT`              | Backend port. | `3000` |

## API surface

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/ai/rewrite-bullet` | `{ bullet, roleContext }` | Returns `{ variants: string[] }` |
| POST | `/api/ai/summary`        | `{ resume, targetRole? }` | Returns `{ summary }` |
| POST | `/api/ai/gap-check`      | `{ resume, jd? }` | Returns `{ gaps, followUps }` |
| POST | `/api/pdf/generate`      | `{ resume }` | Streams `application/pdf` |

## Design decisions

- **Standalone Angular components + signals + reactive forms.** No NgModule ceremony. `ResumeStoreService`
  is a signal-based store persisted to `localStorage` via an `effect`.
- **ATS-safe rendering.** Preview and PDF both use a single-column layout, Calibri/Arial, plain
  hyphen bullets (via `content: '- '` on `<li>::before`, so the dash lives in the PDF text layer and
  is fully searchable / ATS-parseable).
- **Rule-based validation and keyword matching runs client-side** so it stays instant and works
  offline. AI is only used for content generation.
- **PDF is rendered server-side by Puppeteer** rather than client-side (`jsPDF`, `html2pdf`) so the
  output is always text-selectable and never rasterized.
- **Prompt guardrails.** The AI system prompt explicitly forbids inventing metrics/tools/companies
  and enforces the strong-verb / metric / no-fluff rules from the resume brief.

## Security notes

- The backend has no auth (localhost-only tool). Do not expose it to the public internet as-is.
- `npm audit` reports vulnerabilities in transitive build-time deps (webpack toolchain in Angular,
  some in NestJS). Run `snyk_code_scan` and `snyk_sca_scan` from Snyk MCP for a categorized view
  before adopting for anything beyond personal use.
- PDF generation runs Chromium with `--no-sandbox` for portability. If you host this, drop that flag
  and run Puppeteer under a proper sandboxed user.

## Known limitations / next steps

- No reordering UI for skill groups, work entries, or bullets yet (add/remove only).
- Only one resume at a time in localStorage. Multi-resume / versioning is on the roadmap.
- Single template. Additional templates (PM, Data, SRE) can be added by cloning `preview.component.ts`
  and `pdf/resume-template.ts` and selecting via a template picker.
- No auth or shared library - Postgres is set up in Nest but unused. Wire in TypeORM/Prisma when you
  want shared templates or a JD library.
