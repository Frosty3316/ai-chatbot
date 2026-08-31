const CHIPS = [
  "Who is Faustina?",
  "What has she built?",
  "Explain closures in JavaScript",
  "Help me review a REST API",
];

type EmptyStateProps = {
  onAsk: (prompt: string) => void;
};

export function EmptyState({ onAsk }: EmptyStateProps) {
  return (
    <div className="empty">
      <p className="empty-kicker">No sign-in · portfolio unlimited</p>
      <h2>Ask anything.</h2>
      <p className="empty-copy">
        Questions about Faustina are answered from her portfolio, as often as you like.
        General GPT-style questions use a hosted model and are capped for the day.
      </p>
      <div className="chips">
        {CHIPS.map((chip) => (
          <button key={chip} type="button" onClick={() => onAsk(chip)}>
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
