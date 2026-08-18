import { useState } from "react";
import { deleteAllClassSessions, deleteAllStudySessions } from "../utils/dataService";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetableForm({ classSessions, onAdd, onRemove, onClearAll }) {
  const [course, setCourse] = useState("");
  const [day, setDay] = useState("Monday");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");
  const [error, setError] = useState("");

  function handleAdd() {
    if (!course.trim()) {
      setError("Enter a course name.");
      return;
    }
    if (start >= end) {
      setError("End time must be after start time.");
      return;
    }
    setError("");
    onAdd({ course: course.trim(), day, start, end });
    setCourse("");
  }

  async function handleClearAll() {
    if (classSessions.length === 0) return;
    const confirmed = window.confirm("Delete ALL courses and the current study schedule? This can't be undone.");
    if (!confirmed) return;

    await deleteAllClassSessions();
    await deleteAllStudySessions();
    onClearAll();
  }

  return (
    <div className="card">
      <div className="section-header-row">
        <h2>Your Class Timetable</h2>
        {classSessions.length > 0 && (
          <button className="danger-zone-btn" onClick={handleClearAll}>Delete All</button>
        )}
      </div>

      <div className="form-row">
        <div className="field">
          <label>Course</label>
          <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. CSS 101" />
        </div>
        <div className="field">
          <label>Day</label>
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Start</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label>End</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleAdd}>Add</button>
      </div>

      {error && <p style={{ color: "#C4483A", fontSize: 13, marginTop: 8 }}>{error}</p>}

      {classSessions.length === 0 ? (
        <p className="empty-state">No classes added yet. Add your first one above.</p>
      ) : (
        <ul className="session-list">
          {classSessions.map((s, i) => (
            <li key={i} className="session-item">
              <span>
                <strong>{s.course}</strong>{" "}
                <span className="meta">— {s.day}, {s.start}–{s.end}</span>
              </span>
              <button className="btn-danger" onClick={() => onRemove(i)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}