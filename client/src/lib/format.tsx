import type { ReactNode } from "react";

function safeHref(token: string): string | null {
  try {
    const url = new URL(token);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function inline(value: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s<>"']+)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(value))) {
    if (match.index > last) {
      nodes.push(value.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      const href = safeHref(token);
      if (href) {
        nodes.push(
          <a key={key} href={href} target="_blank" rel="noreferrer">
            {token.replace(/^https?:\/\//, "")}
          </a>
        );
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
