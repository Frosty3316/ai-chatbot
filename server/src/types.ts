export type ChatRole = "user" | "assistant";

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export type PortfolioProject = {
  name: string;
  type: string;
  description: string;
  tech: string[];
  url?: string;
  github?: string;
};

export type EducationItem = {
  program: string;
  institution: string;
  years: string;
};

export type ExperienceItem = {
  title: string;
  org: string;
  dates: string;
  summary?: string;
};

export type Portfolio = {
  name: string;
  shortName: string;
  role: string;
  location: string;
  email?: string;
  website?: string;
  github: string;
  education: EducationItem[] | string;
  experience?: ExperienceItem[];
  summary: string;
  interests: string[];
  projects: PortfolioProject[];
  stack?: Record<string, string[]>;
  skills?: string[];
  strengths: string[];
};

export type KnowledgeIntent =
  | "greeting"
  | "about"
  | "role"
  | "location"
  | "skills"
  | "projects"
  | "project"
  | "strengths"
  | "contact"
  | "education"
  | "experience"
  | "assistant"
  | "fallback";

export type KnowledgeResult = {
  intent: KnowledgeIntent;
  reply: string;
  topic: string;
};
