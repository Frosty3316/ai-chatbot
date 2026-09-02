import type { ReactNode } from "react";

function safeHref(token: string): string | null {
  try {
    const url = new URL(token);
    if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "mailto:") {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

function toHref(raw: string): string | null {
  const token = raw.trim();
  if (!token) return null;
  if (/^mailto:/i.test(token) || /^https?:\/\//i.test(token)) return safeHref(token);
  if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(token)) return `mailto:${token}`;
  if (/^(www\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+([/:?#][^\s]*)?$/i.test(token)) {
    return safeHref(`https://${token}`);
  }
  return null;
}

function prettyLabel(href: string, fallback: string): string {
  try {
    const url = new URL(href);
    if (url.protocol === "mailto:") return url.pathname;
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.host}${path}` || fallback;
  } catch {
    return fallback.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}

function markdownLink(token: string): { href: string; label: string } | null {
  const match = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  if (!match) return null;
  const href = toHref(match[2]);
  if (!href) return null;
  return { href, label: match[1] };
}

function angleLink(token: string): { href: string; label: string } | null {
  const match = token.match(/^<([^<>]+)>$/);
  if (!match) return null;
  const href = toHref(match[1]);
  if (!href) return null;
  return { href, label: prettyLabel(href, match[1]) };
}

function linkNode(key: number, href: string, label: string): ReactNode {
  return (
    <a key={key} href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

function inline(value: string): ReactNode[] {
  const pattern =
    /(\[[^\]]+\]\([^)\s]+\)|<[^<>\s]+>|\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s<>"']+|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(value))) {
    if (match.index > last) {
      nodes.push(value.slice(last, match.index));
    }
    const token = match[0];
    const md = markdownLink(token);
    const angled = angleLink(token);
    if (md) {
      nodes.push(linkNode(key, md.href, md.label));
    } else if (angled) {
      nodes.push(linkNode(key, angled.href, angled.label));
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      const href = toHref(token);
      if (href) {
        nodes.push(linkNode(key, href, prettyLabel(href, token)));
      } else {
        nodes.push(token);
      }
    }
    key += 1;
    last = match.index + token.length;
  }

  if (last < value.length) nodes.push(value.slice(last));
  return nodes;
}

function renderBlock(block: string, index: number): ReactNode {
  if (block.startsWith("```")) {
    const lines = block.split("\n");
    const closing = lines[lines.length - 1]?.startsWith("```");
    const code = lines.slice(1, closing ? -1 : undefined).join("\n");
    return (
      <pre key={index} className="code-block">
        <code>{code}</code>
      </pre>
    );
  }

  const lines = block.split("\n").filter((line) => line.length > 0);
  if (lines.length === 0) return null;

  if (lines.length === 1 && /^\*\*[^*]+\*\*$/.test(lines[0])) {
    return <h4 key={index}>{lines[0].slice(2, -2)}</h4>;
  }

  const list = lines.every((line) => /^[-•]\s/.test(line.trim()));
  const numbered = lines.every((line) => /^\d+\.\s/.test(line.trim()));

  if (list || numbered) {
    const List = numbered ? "ol" : "ul";
    return (
      <List key={index}>
        {lines.map((line, lineIndex) => (
          <li key={lineIndex}>{inline(line.trim().replace(/^([•-]|\d+\.)\s*/, ""))}</li>
        ))}
      </List>
    );
  }

  if (lines[0].startsWith("### ")) return <h4 key={index}>{inline(lines[0].slice(4))}</h4>;
  if (lines[0].startsWith("## ")) return <h3 key={index}>{inline(lines[0].slice(3))}</h3>;

  return (
    <p key={index}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex}>
          {lineIndex > 0 && <br />}
          {inline(line)}
        </span>
      ))}
    </p>
  );
}

export function RichText({ text }: { text: string }) {
  const parts = text.split(/(```[\w-]*\n[\s\S]*?```)/g);

  return (
    <>
      {parts.flatMap((part, index) => {
        if (part.startsWith("```")) {
          return [renderBlock(part, index)];
        }
        return part
          .split(/\n{2,}/)
          .filter((block) => block.trim().length > 0)
          .map((block, blockIndex) => renderBlock(block, index * 100 + blockIndex));
      })}
    </>
  );
}
