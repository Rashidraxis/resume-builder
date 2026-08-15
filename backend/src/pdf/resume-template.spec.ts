import { renderResumeHtml } from './resume-template';
import { ResumeDto } from '../shared/resume.dto';

const sample = (): ResumeDto => ({
  contact: {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+1 555 0100',
    location: 'London, UK',
    openToRelocation: true,
    linkedin: 'https://linkedin.com/in/ada',
    github: 'https://github.com/ada',
  },
  summary: 'Backend engineer with 5+ years scaling distributed systems.',
  skills: [
    { category: 'Languages', items: ['Java', 'TypeScript'] },
    { category: 'Databases', items: ['PostgreSQL', 'Redis'] },
  ],
  workExperience: [
    {
      company: 'Analytical Engines Inc',
      title: 'Senior Software Engineer',
      location: 'London, UK',
      startDate: '2022-04',
      endDate: 'Present',
      bullets: [
        'Reduced p95 latency from 800ms to 120ms by rewriting the query pipeline.',
        'Automated deployment via CI/CD, cutting release time from 2 hours to 8 minutes.',
      ],
    },
  ],
  projects: [
    {
      name: 'Difference Engine',
      url: 'https://github.com/ada/diff-engine',
      techStack: ['Rust', 'WebAssembly'],
      bullets: ['Architected a WASM compute kernel achieving 3x throughput over the JS baseline.'],
    },
  ],
  education: [
    {
      institution: 'University of London',
      degree: 'B.Sc. in Mathematics',
      startDate: '2015-09',
      endDate: '2018-06',
      gpa: '',
      coursework: [],
    },
  ],
  certifications: [],
});

describe('renderResumeHtml (ATS-safety guarantees)', () => {
  const html = renderResumeHtml(sample());

  it('emits sections in ATS-canonical order', () => {
    const headers = ['PROFESSIONAL SUMMARY', 'SKILLS', 'WORK EXPERIENCE', 'PROJECTS', 'EDUCATION'];
    const positions = headers.map(h => html.indexOf(h));
    expect(positions.every(p => p !== -1)).toBe(true);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('places bullet dashes as literal DOM text (never via absolute-positioned ::before)', () => {
    expect(html).toContain('<li>- ');
    expect(html).not.toMatch(/li::before/);
    expect(html).not.toMatch(/position:\s*absolute/i);
  });

  it('uses " | " as the title/location delimiter, not a bare hyphen', () => {
    expect(html).toContain('Senior Software Engineer | London, UK');
    expect(html).not.toContain('Senior Software Engineer - London, UK');
  });

  it('renders dates as "Mon YYYY - Mon YYYY" (or " - Present")', () => {
    expect(html).toContain('Apr 2022 - Present');
    expect(html).toContain('Sep 2015 - Jun 2018');
  });

  it('is free of ATS-hostile characters (em/en dashes, smart quotes, bullet chars, emoji)', () => {
    const forbidden = ['\u2013', '\u2014', '\u2018', '\u2019', '\u201C', '\u201D', '\u2022'];
    for (const ch of forbidden) expect(html.includes(ch)).toBe(false);
  });

  it('collapses embedded whitespace in bullets so they render single-line', () => {
    const messy = sample();
    messy.workExperience[0].bullets = ['Reduced\n  p95 latency\tfrom 800ms\n  to 120ms.'];
    const out = renderResumeHtml(messy);
    expect(out).toContain('<li>- Reduced p95 latency from 800ms to 120ms.</li>');
  });

  it('escapes user-supplied HTML to prevent injection into the template', () => {
    const evil = sample();
    evil.contact.name = '<script>alert(1)</script>';
    const out = renderResumeHtml(evil);
    expect(out).not.toContain('<script>alert(1)</script>');
    expect(out).toContain('&lt;script&gt;');
  });
});
