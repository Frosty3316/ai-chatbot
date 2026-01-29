import portfolio from "../data/portfolio.json";
const FAUSTINA_PROFILE = `
Faustina Yarathingal is a tech-focused forensic science student and developer.
She works on AI-driven projects, web applications, and digital forensics tools.
Her interests include artificial intelligence, cybersecurity, fraud analysis,
and building practical software solutions.
`.trim();
export function answerFromPortfolio(prompt, _default) {
    const q = (prompt ?? "").toLowerCase();
    if (q.includes("who is faustina")) {
        return FAUSTINA_PROFILE;
    }
    if (q.includes("location") || q.includes("based")) {
        return `She is based in ${portfolio.location}.`;
    }
    if (q.includes("about") || q.includes("background")) {
        return portfolio.summary;
    }
    if (q.includes("role") || q.includes("what do you do")) {
        return portfolio.role;
    }
    if (q.includes("projects")) {
        return portfolio.projects
            .map((p) => `• ${p.name}: ${p.description}`)
            .join("\n");
    }
    for (const project of portfolio.projects) {
        if (q.includes(project.name.toLowerCase())) {
            return `${project.name}: ${project.description}\nTech used: ${project.tech.join(", ")}`;
        }
    }
    if (q.includes("skills") ||
        q.includes("tech") ||
        q.includes("stack") ||
        q.includes("technologies")) {
        return `She works with: ${portfolio.skills.join(", ")}.`;
    }
    return (_default ??
        "I’m a portfolio assistant. You can ask me about Faustina’s skills, projects, tech stack, or background.");
}
