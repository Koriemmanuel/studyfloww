import { supabase } from "./supabaseClient";

// ---- Class Sessions ----
export async function loadClassSessions() {
  const { data, error } = await supabase.from("class_sessions").select("*").order("created_at");
  if (error) throw error;
  return data.map((r) => ({ dbId: r.id, course: r.course, day: r.day, start: r.start_time, end: r.end_time }));
}

export async function saveClassSession(session) {
  const { data, error } = await supabase
    .from("class_sessions")
    .insert({ course: session.course, day: session.day, start_time: session.start, end_time: session.end })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteClassSessionById(dbId) {
  const { error } = await supabase.from("class_sessions").delete().eq("id", dbId);
  if (error) throw error;
}

export async function deleteAllClassSessions() {
  const { error } = await supabase.from("class_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}

// ---- Study Sessions ----
export async function loadStudySessions() {
  const { data, error } = await supabase.from("study_sessions").select("*").order("created_at");
  if (error) throw error;
  return data.map((r) => ({ id: r.id, course: r.course, day: r.day, start: r.start_time, end: r.end_time, status: r.status }));
}

export async function replaceStudySchedule(schedule) {
  const { error: delErr } = await supabase.from("study_sessions").delete().neq("id", "");
  if (delErr) throw delErr;

  if (schedule.length === 0) return;

  const rows = schedule.map((s) => ({
    id: s.id,
    course: s.course,
    day: s.day,
    start_time: s.start,
    end_time: s.end,
    status: s.status,
  }));
  const { error } = await supabase.from("study_sessions").insert(rows);
  if (error) throw error;
}

export async function updateStudySessionInDb(id, updates) {
  const { error } = await supabase
    .from("study_sessions")
    .update({ start_time: updates.start, end_time: updates.end, status: updates.status })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteStudySessionById(id) {
  const { error } = await supabase.from("study_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllStudySessions() {
  const { error } = await supabase.from("study_sessions").delete().neq("id", "");
  if (error) throw error;
}

// ---- Notes ----
export async function saveNoteToDb(course, topic, content) {
  const { error } = await supabase.from("notes").insert({ course, topic, content });
  if (error) throw error;
}

export async function loadNotesHistory() {
  const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteNoteById(id) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllNotes() {
  const { error } = await supabase.from("notes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}

// ---- Quiz History ----
export async function saveQuizResultToDb(course, topic, score, total) {
  const { error } = await supabase.from("quiz_history").insert({ course, topic, score, total });
  if (error) throw error;
}

export async function loadQuizHistory() {
  const { data, error } = await supabase.from("quiz_history").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteQuizResultById(id) {
  const { error } = await supabase.from("quiz_history").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllQuizHistory() {
  const { error } = await supabase.from("quiz_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}