export interface ResumeContact {
  name: string;
  email: string;
  phone: string;
  location: string;
  openToRelocation?: boolean;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ResumeSkillGroup { category: string; items: string[]; }

export interface ResumeWork {
  company: string; title: string; location?: string;
  startDate: string; endDate: string; bullets: string[];
}

export interface ResumeProject {
  name: string; url?: string; techStack: string[]; bullets: string[];
}

export interface ResumeEducation {
  institution: string; degree: string;
  startDate: string; endDate: string; gpa?: string; coursework?: string[];
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
  verificationUrl?: string;
}

export interface ResumeDto {
  contact: ResumeContact;
  summary: string;
  skills: ResumeSkillGroup[];
  workExperience: ResumeWork[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
}
