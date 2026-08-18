import { useState, useEffect } from "react";
import "./App.css";
import TimetableForm from "./components/TimetableForm";
import ScheduleView from "./components/ScheduleView";
import NotesPanel from "./components/NotesPanel";
import HistoryView from "./components/HistoryView";
import {
  getFreeSlotsForWeek,
  generateStudySchedule,
  getNextResetTime,
  minutesFromTime,
  timeFromMinutes,
} from "./utils/scheduler";
import {
  loadClassSessions,
  saveClassSession,
  deleteClassSessionById,
  loadStudySessions,
  replaceStudySchedule,
  updateStudySessionInDb,
  deleteStudySessionById,
} from "./utils/dataService";

export default function App() {
  const [classSessions, setClassSessions] = useState([]);
  const [studySchedule, setStudySchedule] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("schedule"); // "schedule" | "history"

  // courses is always derived fresh from classSessions —
  // never stored separately, so a deleted class can never linger here.
  const courses = [...new Set(classSessions.map((c) => c.course))];

  useEffect(() => {
    async function load() {
      try {
        const [classes, study] = await Promise.all([loadClassSessions(), loadStudySessions()]);
        setClassSessions(classes);
        setStudySchedule(study);
      } catch (err) {
        console.error("Failed to load saved data:", err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addClass(session) {
    const dbId = await saveClassSession(session);
    setClassSessions((prev) => [...prev, { ...session, dbId }]);
  }

  async function removeClass(index) {
    const session = classSessions[index];
    await deleteClassSessionById(session.dbId);
    setClassSessions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    const freeSlots = getFreeSlotsForWeek(classSessions);
    const newSchedule = generateStudySchedule(freeSlots, courses, 60, 5);
    await replaceStudySchedule(newSchedule);
    setStudySchedule(newSchedule);
  }

  async function handleResetTime(sessionId) {
    const session = studySchedule.find((s) => s.id === sessionId);
    if (!session) return;

    const nextStart = getNextResetTime(session, classSessions, studySchedule, 60);
    if (!nextStart) {
      alert("Day has ended — no more free time today. Try setting it manually or pick another day.");
      return;
    }

    const nextEnd = timeFromMinutes(minutesFromTime(nextStart) + 60);
    const updated = { start: nextStart, end: nextEnd, status: "user-edited" };
    await updateStudySessionInDb(sessionId, updated);
    setStudySchedule((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updated } : s)));
  }

  async function handleManualSet(sessionId, newStart) {
    const updated = { start: newStart, end: timeFromMinutes(minutesFromTime(newStart) + 60), status: "user-edited" };
    await updateStudySessionInDb(sessionId, updated);
    setStudySchedule((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updated } : s)));
  }

  async function handleRemoveSession(sessionId) {
    await deleteStudySessionById(sessionId);
    setStudySchedule((prev) => prev.filter((s) => s.id !== sessionId));
  }

  if (loading) {
    return <div className="app-shell"><p className="empty-state">Loading your saved data…</p></div>;
  }

  return (
    <div className="app-shell">
      <h1 className="app-title">StudyFlow</h1>
      <p className="app-subtitle">Your timetable, turned into a study plan.</p>

      <div className="tabs">
        <button className={`tab-btn ${tab === "schedule" ? "active" : ""}`} onClick={() => setTab("schedule")}>
          Schedule
        </button>
        <button className={`tab-btn ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
          Quiz History
        </button>
      </div>

      {tab === "schedule" ? (
        <>
          <TimetableForm classSessions={classSessions} onAdd={addClass} onRemove={removeClass} />

          <div className="card">
            <button className="btn-primary" onClick={handleGenerate} disabled={classSessions.length === 0}>
              Generate Study Schedule
            </button>
          </div>

          <ScheduleView
            schedule={studySchedule}
            classSessions={classSessions}
            onResetTime={handleResetTime}
            onManualSet={handleManualSet}
            onRemoveSession={handleRemoveSession}
            onOpenNotes={(session) => setActiveSession(session)}
          />
        </>
      ) : (
        <HistoryView />
      )}

      {activeSession && (
        <NotesPanel session={activeSession} onClose={() => setActiveSession(null)} />
      )}
    </div>
  );
}