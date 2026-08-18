import { getAvailableStartsForDay, timeFromMinutes } from "../utils/scheduler";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ScheduleView({ schedule, classSessions, onResetTime, onManualSet, onRemoveSession, onOpenNotes }) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="card">
        <h2>Your Study Schedule</h2>
        <p className="empty-state">Add your timetable, then click "Generate Study Schedule" above.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Your Study Schedule</h2>
      {DAYS.map((day) => {
        const sessions = schedule.filter((s) => s.day === day);
        if (sessions.length === 0) return null;
        return (
          <div className="day-block" key={day}>
            <p className="day-heading">{day}</p>
            {sessions.map((s) => {
              const manualOptions = getAvailableStartsForDay(day, classSessions, schedule, s.id, 60).map(timeFromMinutes);
              return (
                <div className="slot-row" key={s.id}>
                  <span className="slot-time">{s.start}–{s.end}</span>
                  <span className="slot-course">
                    {s.course}
                    {s.status === "user-edited" && <span className="meta"> (edited)</span>}
                  </span>

                  <button className="study-btn" style={{ marginLeft: "auto" }} onClick={() => onOpenNotes(s)}>
                    Study
                  </button>

                  <select
                    value=""
                    onChange={(e) => e.target.value && onManualSet(s.id, e.target.value)}
                    style={{ fontSize: 12, padding: "4px 6px", borderRadius: 6 }}
                  >
                    <option value="">Set manually…</option>
                    {manualOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <button className="btn-danger" onClick={() => onResetTime(s.id)}>Reset Time</button>
                  <button className="btn-danger" onClick={() => onRemoveSession(s.id)}>Remove</button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}