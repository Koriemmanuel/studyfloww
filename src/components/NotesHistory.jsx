import { useState, useEffect } from "react";
import { loadNotesHistory, deleteNoteById, deleteAllNotes } from "../utils/dataService";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotesHistory() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadNotesHistory().then(setNotes).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, e) {
    e.stopPropagation();
    await deleteNoteById(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleClearAll() {
    const confirmed = window.confirm("Delete ALL saved notes? This can't be undone.");
    if (!confirmed) return;
    await deleteAllNotes();
    setNotes([]);
  }

  if (loading) return <p className="empty-state">Loading notes…</p>;
  if (error) return <p className="empty-state">Failed to load notes: {error}</p>;

  if (notes.length === 0) {
    return <p className="empty-state">No notes generated yet. Click "Study" on a session to generate your first one.</p>;
  }

  return (
    <div>
      <div className="section-header-row">
        <span></span>
        <button className="danger-zone-btn" onClick={handleClearAll}>Delete All</button>
      </div>

      {notes.map((n) => {
        const isOpen = expandedId === n.id;
        return (
          <div className="note-history-item" key={n.id}>
            <div className="note-history-header" onClick={() => setExpandedId(isOpen ? null : n.id)}>
              <div>
                <p className="h-topic">{n.topic}</p>
                <p className="h-meta">{n.course} · {timeAgo(n.created_at)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="expand-icon">{isOpen ? "▲ Hide" : "▼ View"}</span>
                <button className="small-delete-btn" onClick={(e) => handleDelete(n.id, e)}>✕</button>
              </div>
            </div>
            {isOpen && <div className="note-history-content">{n.content}</div>}
          </div>
        );
      })}
    </div>
  );
}