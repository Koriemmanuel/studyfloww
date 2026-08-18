import { useState } from "react";
import { saveNoteToDb, saveQuizResultToDb } from "../utils/dataService";

const API_URL = import.meta.env.VITE_API_URL || "https://studyflow-xofs.onrender.com";

export default function NotesPanel({ session, onClose }) {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizProgress, setQuizProgress] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Enter a topic first.");
      return;
    }
    setError("");
    setLoading(true);
    setNotes("");
    setQuiz(null);
    setSubmitted(false);
    setAnswers({});

    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, course: session.course }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setNotes(accumulated);
      }

      saveNoteToDb(session.course, topic, accumulated).catch((e) =>
        console.error("Save note failed:", e.message)
      );
    } catch {
      setError("Could not reach the server. Is the backend running?");
      setLoading(false);
    }
  }

  async function handleGenerateQuiz() {
    setQuizLoading(true);
    setQuiz(null);
    setSubmitted(false);
    setAnswers({});
    setQuizProgress("Starting...");

    try {
      const res = await fetch(`${API_URL}/api/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, course: session.course, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate quiz.");
        setQuizLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        const questionsSoFar = (accumulated.match(/"question"\s*:/g) || []).length;
        setQuizProgress(questionsSoFar > 0 ? `Generating question ${Math.min(questionsSoFar, 5)} of 5...` : "Thinking...");
      }

      let raw = accumulated.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(raw);
      setQuiz(parsed.questions);
    } catch {
      setError("Could not parse the quiz. Please try again.");
    } finally {
      setQuizLoading(false);
      setQuizProgress("");
    }
  }

  function selectAnswer(qIndex, optIndex) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  function handleSubmitQuiz() {
    setSubmitted(true);
    const finalScore = quiz.reduce((total, q, i) => total + (answers[i] === q.correctIndex ? 1 : 0), 0);
    saveQuizResultToDb(session.course, topic, finalScore, quiz.length).catch((e) =>
      console.error("Save quiz result failed:", e.message)
    );
  }

  const score = quiz
    ? quiz.reduce((total, q, i) => total + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  return (
    <div className="overlay">
      <div className="notes-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notes-panel-header">
          <div>
            <h3>{session.course}</h3>
            <p>{session.day}, {session.start}–{session.end}</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="topic-input-row">
          <input
            placeholder="e.g. Data Structures"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Notes"}
          </button>
        </div>

        {error && <p style={{ color: "#C4483A", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        {loading && <p className="notes-loading">Asking NVIDIA NIM to generate your notes…</p>}
        {notes && <div className="notes-output">{notes}</div>}

        {notes && !loading && (
          <div className="quiz-section">
            {!quiz && (
              <button className="btn-primary" onClick={handleGenerateQuiz} disabled={quizLoading}>
                {quizLoading ? "Building quiz..." : "Test My Understanding"}
              </button>
            )}

            {quizLoading && <p className="notes-loading">{quizProgress || "Generating quiz questions…"}</p>}

            {quiz && (
              <>
                {quiz.map((q, qi) => (
                  <div className="quiz-question" key={qi}>
                    <p className="q-text">{qi + 1}. {q.question}</p>
                    {q.options.map((opt, oi) => {
                      let cls = "quiz-option";
                      if (answers[qi] === oi) cls += " selected";
                      if (submitted && oi === q.correctIndex) cls += " correct";
                      if (submitted && answers[qi] === oi && oi !== q.correctIndex) cls += " incorrect";
                      return (
                        <div key={oi} className={cls} onClick={() => selectAnswer(qi, oi)}>
                          {opt}
                        </div>
                      );
                    })}
                    {submitted && <p className="quiz-explanation">{q.explanation}</p>}
                  </div>
                ))}

                {!submitted ? (
                  <button
                    className="btn-primary"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(answers).length < quiz.length}
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <p className="quiz-score">You scored {score} / {quiz.length}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}