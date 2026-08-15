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
