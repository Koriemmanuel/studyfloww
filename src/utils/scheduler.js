// utils/scheduler.js

export function minutesFromTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function getFreeSlotsForDay(occupied, dayStart = "08:00", dayEnd = "23:00") {
  const dayStartMin = minutesFromTime(dayStart);
  const dayEndMin = minutesFromTime(dayEnd);

  const blocks = occupied
    .map((b) => ({ start: minutesFromTime(b.start), end: minutesFromTime(b.end) }))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const block of blocks) {
    if (merged.length === 0 || block.start > merged[merged.length - 1].end) {
      merged.push({ ...block });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, block.end);
    }
  }

  const freeSlots = [];
  let cursor = dayStartMin;

  for (const block of merged) {
    if (block.start > cursor) {
      freeSlots.push({ start: cursor, end: block.start });
    }
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < dayEndMin) {
    freeSlots.push({ start: cursor, end: dayEndMin });
  }

  return freeSlots;
}

export function getFreeSlotsForWeek(classSessions, studySessions = [], dayStart = "08:00", dayEnd = "23:00") {
  const result = {};
  for (const day of DAYS) {
    const occupied = [...classSessions, ...studySessions].filter((s) => s.day === day);
    result[day] = getFreeSlotsForDay(occupied, dayStart, dayEnd);
  }
  return result;
}

export function generateStudySchedule(freeSlotsByDay, courses, sessionDuration = 60, maxSessionsPerCoursePerWeek = 5) {
  const schedule = [];
  const weeklyCount = {};
  courses.forEach((c) => (weeklyCount[c] = 0));
  let courseIndex = 0;

  for (const day of DAYS) {
    const slots = freeSlotsByDay[day] || [];
    const scheduledToday = new Set();

    for (const slot of slots) {
      let cursor = slot.start;

      while (cursor + sessionDuration <= slot.end) {
        let assigned = null;
        for (let i = 0; i < courses.length; i++) {
          const candidate = courses[(courseIndex + i) % courses.length];
          if (weeklyCount[candidate] < maxSessionsPerCoursePerWeek && !scheduledToday.has(candidate)) {
            assigned = candidate;
            courseIndex = (courseIndex + i + 1) % courses.length;
            break;
          }
        }

        if (!assigned) break;

        schedule.push({
          id: `${day}-${cursor}`,
          course: assigned,
          day,
          start: timeFromMinutes(cursor),
          end: timeFromMinutes(cursor + sessionDuration),
          status: "auto-generated",
        });

        weeklyCount[assigned]++;
        scheduledToday.add(assigned);
        cursor += sessionDuration;
      }
    }
  }

  return schedule;
}

/**
 * Returns every valid session start time (in minutes) for a given day,
 * excluding a specific session (so a session doesn't collide with itself
 * while being moved).
 */
export function getAvailableStartsForDay(day, classSessions, studySessions, excludeId, sessionDuration = 60, dayStart = "08:00", dayEnd = "23:00") {
  const occupied = [
    ...classSessions.filter((s) => s.day === day),
    ...studySessions.filter((s) => s.day === day && s.id !== excludeId),
  ];
  const freeSlots = getFreeSlotsForDay(occupied, dayStart, dayEnd);
  const starts = [];
  for (const slot of freeSlots) {
    let cursor = slot.start;
    while (cursor + sessionDuration <= slot.end) {
      starts.push(cursor);
      cursor += sessionDuration;
    }
  }
  return starts.sort((a, b) => a - b); // minutes, ascending
}

/**
 * "Reset Time" — finds the next available slot LATER than the session's
 * current start, same day. Returns null if the day has no more room
 * (caller should show "Day has ended").
 */
export function getNextResetTime(session, classSessions, studySessions, sessionDuration = 60) {
  const currentStart = minutesFromTime(session.start);
  const availableStarts = getAvailableStartsForDay(session.day, classSessions, studySessions, session.id, sessionDuration);
  const next = availableStarts.find((t) => t > currentStart);
  return next === undefined ? null : timeFromMinutes(next);
}