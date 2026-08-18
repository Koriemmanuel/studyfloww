import { useState, useEffect } from "react";
import { loadQuizHistory } from "../utils/dataService";

function scoreClass(score, total) {
  const pct = score / total;
  if (pct >= 0.7) return "score-good";
  if (pct >= 0.4) return "score-mid";
  return "score-low";
}

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

export default function QuizHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuizHistory()
      .then(setHistory)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty-state">Loading history…</p>;
  if (error) return <p className="empty-state">Failed to load history: {error}</p>;

  if (history.length === 0) {
    return <p className="empty-state">No quizzes taken yet. Study a topic and take a quiz to see your progress here.</p>;
  }

  const totalQuizzes = history.length;
  const avgPct = Math.round(
    (history.reduce((sum, h) => sum + h.score / h.total, 0) / totalQuizzes) * 100
  );
  const bestScore = Math.max(...history.map((h) => Math.round((h.score / h.total) * 100)));

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-value">{totalQuizzes}</div>
          <div className="stat-label">Quizzes Taken</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{avgPct}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{bestScore}%</div>
          <div className="stat-label">Best Score</div>
        </div>
      </div>

      {history.map((h) => (
        <div className="history-item" key={h.id}>
          <div className="history-info">
            <p className="h-topic">{h.topic}</p>
            <p className="h-meta">{h.course} · {timeAgo(h.created_at)}</p>
          </div>
          <div className={`history-score ${scoreClass(h.score, h.total)}`}>
            {h.score}/{h.total}
          </div>
        </div>
      ))}
    </div>
  );
}