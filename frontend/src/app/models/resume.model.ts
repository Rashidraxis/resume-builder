export interface Contact {
  name: string;
  email: string;
  phone: string;
  location: string;
  openToRelocation?: boolean;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

// Dates stored as 'YYYY-MM' internally; 'Present' allowed for endDate.
export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface Project {
  name: string;
  url?: string;
  techStack: string[];
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  coursework?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
  /** @deprecated Use url. Kept for resumes saved before the field was renamed. */
  verificationUrl?: string;
}

export interface Resume {
  contact: Contact;
  summary: string;
  skills: SkillGroup[];
  workExperience: WorkExperience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
}

export interface ResumeImport {
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    openToRelocation?: boolean;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  skills?: Record<string, string[] | string>;
  experience?: Array<{
    company?: string;
    title?: string;
    location?: string;
    dates?: string;
    bullets?: string[];
  }>;
  projects?: Array<{
    name?: string;
    link?: string;
    techStack?: string | string[];
    bullets?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    dates?: string;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    url?: string;
    verificationUrl?: string;
  }>;
}

export const emptyResume = (): Resume => ({
  contact: {
    name: '',
    email: '',
    phone: '',
    location: '',
    openToRelocation: false,
    linkedin: '',
    github: '',
    portfolio: '',
  },
  summary: '',
  skills: [],
  workExperience: [],
  projects: [],
  education: [],
  certifications: [],
});
