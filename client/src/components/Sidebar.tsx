import { ChatList } from "./ChatList";
import { Mark } from "./Icons";
import type { ConnectionState, Conversation } from "../types";

const TOPICS = [
  { label: "Background", prompt: "Who is Faustina?" },
  { label: "Projects", prompt: "What has she built?" },
  { label: "Stack", prompt: "What is her tech stack?" },
];

type SidebarProps = {
  connection: ConnectionState;
  conversations: Conversation[];
  activeId: string | null;
  onAsk: (prompt: string) => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (ids: string[]) => void;
  onRename: (id: string, title: string) => void;
  onPin: (ids: string[], pinned: boolean) => void;
  remainingGeneral: number;
  generalLimit: number;
};

const STATUS: Record<ConnectionState, string> = {
  checking: "Starting model",
  waking: "Starting model",
  ready: "Ready",
  offline: "Model offline",
};

export function Sidebar({
  connection,
  conversations,
  activeId,
  onAsk,
  onNew,
  onSelect,
  onDelete,
  onRename,
  onPin,
  remainingGeneral,
  generalLimit,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Mark size={28} />
        <div>
          <p className="brand-kicker">Free · no sign-in</p>
          <h1>Dossier</h1>
        </div>
      </div>

      <button type="button" className="icon-btn send new-chat" onClick={onNew}>
        New chat
      </button>

      <div className={`status status-${connection}`}>
        <span className="status-dot" />
        {STATUS[connection]}
      </div>

      <ChatList
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelect}
        onDelete={onDelete}
        onRename={onRename}
        onPin={onPin}
      />

      <p className="sidebar-note">
        {remainingGeneral} / {generalLimit} general questions left today. Faustina questions are unlimited.
      </p>

      <nav className="topics" aria-label="Portfolio topics">
        {TOPICS.map((topic) => (
          <button key={topic.label} type="button" onClick={() => onAsk(topic.prompt)}>
            {topic.label}
          </button>
        ))}
      </nav>

      <section className="profile">
        <p className="profile-name">Faustina Yarathingal</p>
        <p className="profile-role">Full-stack developer & forensic scientist</p>
        <p className="profile-meta">Mumbai · GitHub @Frosty3316</p>
      </section>
    </aside>
  );
}
