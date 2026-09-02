import portfolio from "../../src/data/portfolio.json" with { type: "json" };

export type RouteKind = "portfolio" | "general";

const FOLLOW_UP =
  /^(what about|tell me more|more details|and (?:the )?.+|the (?:first|second|third|last)(?: one)?|that one|this one)\b/i;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export function isPortfolioQuestion(query: string, lastSource?: RouteKind): boolean {
  const q = normalize(query);
  if (/faustina|frosty3316|yarathingal/.test(q)) return true;
  if (/(contact|email|website|github|reach me|phone)/.test(q)) return true;
  if (
    /\b(her|she)\b/.test(q) &&
    /(skill|project|stack|work|background|role|github|portfolio|built|strength|educat|intern|language|contact|email)/.test(q)
  ) {
    return true;
  }
  if (
    /(who is she|about her|your (portfolio|projects|skills)|this (assistant|app|chatbot)|inkroom|mini docs|focusflow|tasknest|atmo|dossier|weather app|to-?do app)/.test(
      q
    )
  ) {
    return true;
  }
  if (/(iit|xavier|clue4|collegetips|internshala|mumbai|forensic)/.test(q)) return true;
  return lastSource === "portfolio" && FOLLOW_UP.test(query.trim());
}

function formatProject(project: (typeof portfolio.projects)[number]): string {
  const url = "url" in project && project.url ? `\n${project.url}` : "";
  const github = "github" in project && project.github ? `\nSource: ${project.github}` : "";
  return `**${project.name}** (${project.type})\n${project.description}\nTech: ${project.tech.join(", ")}${url}${github}`;
}

function formatEducation(): string {
  return portfolio.education
    .map((item) => `• **${item.program}** — ${item.institution} (${item.years})`)
    .join("\n");
}

function formatExperience(): string {
  return portfolio.experience
    .map((item) => {
      const extra = "summary" in item && item.summary ? ` — ${item.summary}` : "";
      return `• **${item.title}**, ${item.org} (${item.dates})${extra}`;
    })
    .join("\n");
}

function formatStack(): string {
  return Object.entries(portfolio.stack)
    .map(([group, items]) => `**${group}**\n\n${items.map((item) => `• ${item}`).join("\n")}`)
    .join("\n\n");
}

function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.host}${path}`;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}

function formatContact(): string {
  return [
    "**Contact**",
    "",
    `• Email: [${portfolio.email}](mailto:${portfolio.email})`,
    `• Website: [${displayUrl(portfolio.website)}](${portfolio.website})`,
    `• GitHub: [${displayUrl(portfolio.github)}](${portfolio.github})`,
  ].join("\n");
}

function findProject(query: string) {
  const q = normalize(query);
  return portfolio.projects.find((project) => {
    const name = normalize(project.name);
    const aliases = [name];
    if (name.includes("tasknest")) aliases.push("todo", "to do", "to-do", "task");
    if (name.includes("atmo")) aliases.push("weather");
    if (name.includes("inkroom")) aliases.push("mini docs", "minidocs", "collaborative");
    if (name.includes("dossier")) aliases.push("chatbot", "assistant");
    if (name.includes("focusflow")) aliases.push("landing", "timer");
    return aliases.some((alias) => alias.length > 2 && q.includes(alias));
  });
}

export function answerFromPortfolio(query: string): string {
  const q = normalize(query);

  if (/(github|contact|reach|email|website|portfolio site|phone)/.test(q)) {
    return formatContact();
  }

  const project = findProject(q);

  if (project && !/projects|built|build/.test(q)) {
    return formatProject(project);
  }
  if (/(skill|tech|stack|technolog|languages|tools)/.test(q)) {
    return `${portfolio.shortName}'s stack:\n\n${formatStack()}`;
  }
  if (/(intern|experience|work history|clue4|collegetips|internshala)/.test(q)) {
    return `**Experience**\n\n${formatExperience()}`;
  }
  if (/(educat|degree|diploma|iit|xavier|studying|student)/.test(q)) {
    return `**Education**\n\n${formatEducation()}`;
  }
  if (/(where|location|based|mumbai)/.test(q)) {
    return `${portfolio.shortName} is based in ${portfolio.location}.`;
  }
  if (/(strength|good at)/.test(q)) {
    return `${portfolio.shortName}'s strengths:\n\n${portfolio.strengths.map((item) => `• ${item}`).join("\n")}`;
  }
  if (/(project|built|build|apps)/.test(q) || /show me her projects/.test(q) || /(her work|she work)/.test(q)) {
    return portfolio.projects.map((item) => `• ${formatProject(item)}`).join("\n\n");
  }
  if (/(how do you work|what are you|this assistant)/.test(q)) {
    return `I am Dossier. Questions about Faustina are answered from a structured portfolio source, with no daily limit. General questions use a hosted model, capped so the demo stays usable. I will not invent her experience.`;
  }

  return [
    `**${portfolio.name}** — ${portfolio.role}, based in ${portfolio.location}.`,
    portfolio.summary,
    `**Education**\n\n${formatEducation()}`,
    formatExperience() ? `**Experience**\n\n${formatExperience()}` : "",
    `Interests: ${portfolio.interests.join(", ")}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
