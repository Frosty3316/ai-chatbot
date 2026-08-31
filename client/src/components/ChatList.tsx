import { useEffect, useMemo, useRef, useState, type MouseEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { MoreIcon, PinIcon } from "./Icons";
import { sortConversations } from "../services/conversations";
import type { Conversation } from "../types";

type ChatListProps = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (ids: string[]) => void;
  onRename: (id: string, title: string) => void;
  onPin: (ids: string[], pinned: boolean) => void;
};

type MenuState = {
  x: number;
  y: number;
  ids: string[];
};

export function ChatList({ conversations, activeId, onSelect, onDelete, onRename, onPin }: ChatListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const ordered = useMemo(() => sortConversations(conversations), [conversations]);
  const pinned = ordered.filter((chat) => chat.pinned);
  const rest = ordered.filter((chat) => !chat.pinned);

  useEffect(() => {
    if (!menu) return;
    function close(event: Event) {
      if (menuRef.current && event.target instanceof Node && menuRef.current.contains(event.target)) return;
      setMenu(null);
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  useEffect(() => {
    if (renamingId) renameRef.current?.select();
  }, [renamingId]);

  function idsForRow(id: string): string[] {
    if (selected.has(id) && selected.size > 1) return [...selected];
    return [id];
  }

  function openMenu(event: MouseEvent, id: string) {
    event.preventDefault();
    event.stopPropagation();
    const x = Math.min(event.clientX, window.innerWidth - 188);
    const y = Math.min(event.clientY, window.innerHeight - 168);
    setMenu({ x, y, ids: idsForRow(id) });
  }

  function startRename(id: string) {
    const chat = conversations.find((item) => item.id === id);
    if (!chat) return;
    setRenamingId(id);
    setDraft(chat.title);
    setMenu(null);
  }

  function commitRename() {
    if (!renamingId) return;
    onRename(renamingId, draft);
    setRenamingId(null);
  }

  function onRenameKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename();
    }
    if (event.key === "Escape") {
      setRenamingId(null);
    }
  }

  function renderGroup(title: string, items: Conversation[]) {
    if (items.length === 0) return null;
    return (
      <div className="chat-group">
        {title ? <p className="chat-group-label">{title}</p> : null}
        {items.map((chat) => {
          const isSelected = selected.has(chat.id);
          return (
            <div
              key={chat.id}
              className={`chat-item ${chat.id === activeId ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
              onContextMenu={(event) => openMenu(event, chat.id)}
            >
              {renamingId === chat.id ? (
                <input
                  ref={renameRef}
                  className="chat-rename"
                  value={draft}
                  aria-label="Rename chat"
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={onRenameKey}
                />
              ) : (
                <button
                  type="button"
                  className="chat-item-main"
                  onClick={(event) => {
                    if (event.ctrlKey || event.metaKey) {
                      setSelected((current) => {
                        const next = new Set(current);
                        if (next.has(chat.id)) next.delete(chat.id);
                        else next.add(chat.id);
                        return next;
                      });
                      return;
                    }
                    setSelected(new Set());
                    onSelect(chat.id);
                  }}
                >
                  {chat.pinned && <PinIcon />}
                  <span>{chat.title}</span>
                </button>
              )}
              <button
                type="button"
                className="chat-item-more"
                aria-label={`Chat actions for ${chat.title}`}
                onClick={(event) => openMenu(event, chat.id)}
              >
                <MoreIcon />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  const menuChats = menu ? conversations.filter((chat) => menu.ids.includes(chat.id)) : [];
  const allPinned = menuChats.length > 0 && menuChats.every((chat) => chat.pinned);
  const many = (menu?.ids.length ?? 0) > 1;

  return (
    <section className="chat-panel">
      <h2 className="chat-heading">Chats</h2>
      <p className="chat-hint">Right-click to rename or pin. Ctrl/Cmd-click selects several.</p>
      <div className="chat-list">
        {conversations.length === 0 ? (
          <p className="sidebar-note">No saved chats yet. Start one and it stays in this browser.</p>
        ) : (
          <>
            {pinned.length > 0 ? (
              <>
                {renderGroup("Pinned", pinned)}
                {renderGroup("Recent", rest)}
              </>
            ) : (
              renderGroup("", rest)
            )}
          </>
        )}
      </div>

      {menu &&
        createPortal(
          <div
            ref={menuRef}
            className="chat-menu"
            role="menu"
            style={{ top: menu.y, left: menu.x }}
          >
            {!many && (
              <button type="button" role="menuitem" onClick={() => startRename(menu.ids[0])}>
                Rename
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onPin(menu.ids, !allPinned);
                setMenu(null);
              }}
            >
              {allPinned ? (many ? "Unpin selected" : "Unpin") : many ? "Pin selected" : "Pin"}
            </button>
            <button
              type="button"
              role="menuitem"
              className="is-danger"
              onClick={() => {
                onDelete(menu.ids);
                setSelected(new Set());
                setMenu(null);
              }}
            >
              {many ? "Delete selected" : "Delete"}
            </button>
            {many && <p className="chat-menu-hint">{menu.ids.length} chats</p>}
          </div>,
          document.body
        )}
    </section>
  );
}
