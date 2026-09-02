import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type {
  ChatTurn,
  KnowledgeIntent,
  KnowledgeResult,
  Portfolio,
  PortfolioProject,
} from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const portfolioPath = path.join(__dirname, "../data/portfolio.json");

export const portfolio: Portfolio = JSON.parse(
  fs.readFileSync(portfolioPath, "utf-8")
) as Portfolio;

const FALLBACK = `I only answer from Faustina's portfolio. Try asking about her background, skills, projects, or stack.`;

const FOLLOW_UP =
  /^(what about|tell me more|more details|and (?:the )?.+|the (?:first|second|third|last)(?: one)?|that one|this one)\b/i;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function projectAliases(project: PortfolioProject): string[] {
  const name = normalize(project.name);
  const parts = name.split(" ").filter(Boolean);
  const aliases = new Set<string>([name, ...parts]);

  if (name.includes("focusflow") || name.includes("landing")) {
    aliases.add("landing");
    aliases.add("landing page");
    aliases.add("focusflow");
  }
  if (name.includes("tasknest") || name.includes("to-do") || name.includes("todo")) {
    aliases.add("todo");
    aliases.add("to do");
    aliases.add("tasks");
    aliases.add("tasknest");
  }
  if (name.includes("atmo") || name.includes("weather")) {
    aliases.add("weather");
    aliases.add("atmo");
  }
  if (name.includes("chatbot") || name.includes("assistant") || name.includes("dossier")) {
    aliases.add("chatbot");
    aliases.add("this app");
    aliases.add("this assistant");
    aliases.add("dossier");
  }
  if (name.includes("mini docs")) {
    aliases.add("docs");
    aliases.add("collaborative");
  }

  return [...aliases];
}

function findProject(query: string): PortfolioProject | undefined {
  const q = normalize(query);
  return portfolio.projects.find((project) =>
    projectAliases(project).some((alias) => alias.length > 2 && q.includes(alias))
  );
}

function projectIndexFromFollowUp(query: string): number | undefined {
  const q = normalize(query);
  if (q.includes("first")) return 0;
  if (q.includes("second")) return 1;
  if (q.includes("third")) return 2;
  if (q.includes("last")) return portfolio.projects.length - 1;
  return undefined;
}

function formatProject(project: PortfolioProject): string {
  const url = project.url ? `\n${project.url}` : "";
  const github = project.github ? `\nSource: ${project.github}` : "";
  return `**${project.name}** (${project.type})\n${project.description}\nTech: ${project.tech.join(", ")}${url}${github}`;
}

function formatProjects(): string {
  return portfolio.projects.map((project) => `• ${formatProject(project)}`).join("\n\n");
}

function formatEducation(): string {
  if (typeof portfolio.education === "string") return portfolio.education;
  return portfolio.education
    .map((item) => `• **${item.program}** — ${item.institution} (${item.years})`)
    .join("\n");
}

function formatExperience(): string {
  if (!portfolio.experience?.length) return "";
  return portfolio.experience
    .map((item) => {
      const extra = item.summary ? ` — ${item.summary}` : "";
      return `• **${item.title}**, ${item.org} (${item.dates})${extra}`;
    })
    .join("\n");
}

function formatStack(): string {
  if (portfolio.stack) {
    return Object.entries(portfolio.stack)
      .map(([group, items]) => `**${group}**\n\n${items.map((item) => `• ${item}`).join("\n")}`)
      .join("\n\n");
  }
  return (portfolio.skills ?? []).map((skill) => `• ${skill}`).join("\n");
}

function aboutReply(): string {
  return [
    `**${portfolio.name}** — ${portfolio.role}, based in ${portfolio.location}.`,
    portfolio.summary,
    `**Education**\n${formatEducation()}`,
    formatExperience() ? `**Experience**\n${formatExperience()}` : "",
    `Interests: ${portfolio.interests.join(", ")}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function skillsReply(): string {
  return `${portfolio.shortName}'s stack:\n\n${formatStack()}`;
}

function classify(query: string): KnowledgeIntent {
  const q = normalize(query);

  if (includesAny(q, ["how do you work", "how does this", "what are you", "are you ai", "llm", "openai"])) {
    return "assistant";
  }
  if (/^(hi|hello|hey)\b/.test(q) || includesAny(q, ["good morning", "good evening"])) {
    return "greeting";
  }
  if (includesAny(q, ["github", "contact", "email", "reach", "linkedin", "social", "website"])) {
    return "contact";
  }
  if (includesAny(q, ["strength", "strengths", "good at", "quality"])) {
    return "strengths";
  }
  if (includesAny(q, ["where", "location", "based", "live", "from", "mumbai"])) {
    return "location";
  }
  if (includesAny(q, ["intern", "experience", "clue4", "collegetips", "internshala"])) {
    return "experience";
  }
  if (includesAny(q, ["educat", "degree", "diploma", "iit", "xavier", "studying", "student"])) {
    return "education";
  }
  if (includesAny(q, ["role", "job", "title", "what do you do", "what does she do"])) {
    return "role";
  }
  if (includesAny(q, ["skill", "tech", "stack", "technolog", "languages", "tools"])) {
    return "skills";
  }
  if (findProject(q)) {
    return "project";
  }
  if (includesAny(q, ["project", "built", "build", "work", "portfolio", "apps"])) {
    return "projects";
  }
  if (includesAny(q, ["who", "about", "background", "bio", "faustina", "forensic"])) {
    return "about";
  }
  return "fallback";
}

function replyForIntent(intent: KnowledgeIntent, query: string): KnowledgeResult {
  switch (intent) {
    case "greeting":
      return {
        intent,
        topic: "greeting",
        reply: `Hi — I can walk you through ${portfolio.shortName}'s work. Ask about her background, projects, or stack.`,
      };
    case "about":
      return { intent, topic: "about", reply: aboutReply() };
    case "role":
      return {
        intent,
        topic: "role",
        reply: `${portfolio.name} is a ${portfolio.role}. ${portfolio.summary}`,
      };
    case "location":
      return {
        intent,
        topic: "location",
        reply: `${portfolio.shortName} is based in ${portfolio.location}.`,
      };
    case "skills":
      return { intent, topic: "skills", reply: skillsReply() };
    case "education":
      return { intent, topic: "education", reply: `**Education**\n\n${formatEducation()}` };
    case "experience":
      return {
        intent,
        topic: "experience",
        reply: formatExperience()
          ? `**Experience**\n\n${formatExperience()}`
          : aboutReply(),
      };
    case "projects":
      return { intent, topic: "projects", reply: formatProjects() };
    case "project": {
      const project = findProject(query);
      return {
        intent,
        topic: project?.name ?? "project",
        reply: project ? formatProject(project) : formatProjects(),
      };
    }
    case "strengths":
      return {
        intent,
        topic: "strengths",
        reply: `${portfolio.shortName}'s strengths:\n\n${portfolio.strengths.map((item) => `• ${item}`).join("\n")}`,
      };
    case "contact":
      return {
        intent,
        topic: "contact",
        reply: [
          "**Contact**",
          "",
          portfolio.email ? `• Email: [${portfolio.email}](mailto:${portfolio.email})` : "",
          portfolio.website
            ? `• Website: [${portfolio.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}](${portfolio.website})`
            : "",
          `• GitHub: [${portfolio.github.replace(/^https?:\/\//, "")}](${portfolio.github})`,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    case "assistant":
      return {
        intent,
        topic: "assistant",
        reply: `I am Dossier, a GPT-style assistant. I can answer general questions, remember this chat, and use a structured source for ${portfolio.shortName}'s role, skills, and projects. I will not invent her experience.`,
      };
    default:
      return { intent: "fallback", topic: "fallback", reply: FALLBACK };
  }
}

function resolveFollowUp(query: string, history: ChatTurn[]): KnowledgeResult | null {
  if (!FOLLOW_UP.test(query.trim()) && tokens(query).length > 4) {
    return null;
  }

  const lastAssistant = [...history].reverse().find((turn) => turn.role === "assistant");
  if (!lastAssistant) return null;

  const indexed = projectIndexFromFollowUp(query);
  if (indexed !== undefined) {
    const project = portfolio.projects[indexed];
    if (project) {
      return { intent: "project", topic: project.name, reply: formatProject(project) };
    }
  }

  const mentioned = findProject(query);
  if (mentioned) {
    return { intent: "project", topic: mentioned.name, reply: formatProject(mentioned) };
  }

  if (/more|detail|that|this/i.test(query) && lastAssistant.content.includes("**")) {
    return {
      intent: "projects",
      topic: "projects",
      reply: `Here is the same work, with the tech called out:\n\n${formatProjects()}`,
    };
  }

  return null;
}

export function answerFromPortfolio(prompt: string, history: ChatTurn[] = []): KnowledgeResult {
  const query = prompt.trim();
  if (!query) {
    return { intent: "fallback", topic: "fallback", reply: FALLBACK };
  }

  const followUp = resolveFollowUp(query, history);
  if (followUp && classify(query) === "fallback") {
    return followUp;
  }

  return replyForIntent(classify(query), query);
}

export function portfolioFacts(): string {
  return JSON.stringify(portfolio, null, 2);
}
