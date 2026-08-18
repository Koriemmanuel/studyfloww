import { useState } from "react";
import QuizHistory from "./QuizHistory";
import NotesHistory from "./NotesHistory";

export default function HistoryView() {
  const [subTab, setSubTab] = useState("quizzes"); // "quizzes" | "notes"

  return (
    <div className="card">
      <h2>History</h2>
      <div className="sub-tabs">
        <button
          className={`sub-tab-btn ${subTab === "quizzes" ? "active" : ""}`}
          onClick={() => setSubTab("quizzes")}
        >
          Quizzes
        </button>
        <button
          className={`sub-tab-btn ${subTab === "notes" ? "active" : ""}`}
          onClick={() => setSubTab("notes")}
        >
          Notes
        </button>
      </div>

      {subTab === "quizzes" ? <QuizHistory embedded /> : <NotesHistory />}
    </div>
  );
}