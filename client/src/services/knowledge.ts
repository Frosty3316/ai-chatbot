export {
  answerFromPortfolio,
  isPortfolioQuestion,
  type RouteKind,
} from "../../api/_lib/knowledge.ts";

export async function streamText(
  text: string,
  onDelta: (chunk: string) => void,
  shouldStop: () => boolean
) {
  const chunks = text.split(/(\s+)/);
  for (const chunk of chunks) {
    if (shouldStop()) return;
    onDelta(chunk);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
