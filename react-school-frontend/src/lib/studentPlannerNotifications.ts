import { getPlannerData } from "@/services/plannerService";

export type StoredStudentNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const STORAGE = (studentId: number) => `student_notifications_${studentId}`;

const PREFIX_FIRED = (studentId: number) => `planner_fired_${studentId}_`;
const DEBOUNCE_KEY = (studentId: number) => `planner_rm_debounce_${studentId}`;

/** Map planner day strings (Monday / Mon) to JS getDay() (Sun=0). */
function plannerDayToIndex(day: string): number | null {
  const raw = day.trim().toLowerCase().replace(/\.$/, "");
  const head = raw.length >= 3 ? raw.slice(0, 3) : raw;
  const map: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };
  if (map[raw] !== undefined) return map[raw];
  if (map[head] !== undefined) return map[head];
  return null;
}

/** Start time parsed from `08:00` or range `08:00-09:00`. */
function parseStartHm(timeSlot: string): { h: number; m: number } | null {
  const trimmed = timeSlot.trim();
  const chunk = trimmed.includes("-") ? trimmed.split("-")[0].trim() : trimmed;
  const [hRaw, mRaw] = chunk.split(":").map((p) => p.trim());
  const h = Number(hRaw);
  const m = Number(mRaw ?? 0);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return { h, m };
}

/** Next occurrence of weekday at local clock time after `from`. */
function nextWeeklyOccurrence(dayIndex: number, h: number, m: number, from = new Date()): Date {
  const anchor = new Date(from);
  const curDow = anchor.getDay();
  let delta = (dayIndex - curDow + 7) % 7;

  const candidate = new Date(anchor);
  candidate.setHours(h, m, 0, 0);
  candidate.setDate(candidate.getDate() + delta);

  if (candidate.getTime() <= from.getTime() + 250) {
    candidate.setDate(candidate.getDate() + 7);
  }
  return candidate;
}

/**
 * Roughly "around 10 minutes before" — tolerant window so misses are unlikely when we poll every minute or two.
 */
function shouldFireReminder(whenStarts: Date, now = Date.now()) {
  const msUntil = whenStarts.getTime() - now;
  const twelveMin = 12 * 60 * 1000;
  const sixMin = 6 * 60 * 1000;
  return msUntil <= twelveMin && msUntil >= sixMin;
}

export function loadStudentNotifications(studentId: number): StoredStudentNotification[] {
  try {
    const raw = sessionStorage.getItem(STORAGE(studentId));
    const list = raw ? (JSON.parse(raw) as StoredStudentNotification[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persistStudentNotifications(studentId: number, entries: StoredStudentNotification[]) {
  const trimmed = entries.slice(0, 80);
  sessionStorage.setItem(STORAGE(studentId), JSON.stringify(trimmed));
}

function pushStudentNotification(studentId: number, draft: Omit<StoredStudentNotification, "read">) {
  const list = loadStudentNotifications(studentId);
  if (list.some((n) => n.id === draft.id)) return;
  list.unshift({
    ...draft,
    read: false,
  });
  persistStudentNotifications(studentId, list);
}

export function markAllStudentNotificationsRead(studentId: number) {
  const list = loadStudentNotifications(studentId).map((n) => ({ ...n, read: true }));
  persistStudentNotifications(studentId, list);
}

export function countUnreadStudentNotifications(studentId: number): number {
  return loadStudentNotifications(studentId).filter((n) => !n.read).length;
}

/**
 * Loads planner entries and emits at most one toast-style notification bucket per tick
 * for sessions/schedules whose next start is ~10 minutes away.
 */
export async function sweepStudentPlannerReminders(studentId: number) {
  if (!studentId) return;

  const debKey = DEBOUNCE_KEY(studentId);
  const last = Number(sessionStorage.getItem(debKey) || "0");
  if (Date.now() - last < 45_000) return;

  sessionStorage.setItem(debKey, String(Date.now()));

  let planner;
  try {
    planner = await getPlannerData(studentId);
  } catch {
    return;
  }

  const nowDate = new Date();

  for (const s of planner.autoPlan ?? []) {
    const dow = plannerDayToIndex(s.day);
    if (dow == null) continue;
    const hm = parseStartHm(s.time);
    if (!hm) continue;

    const when = nextWeeklyOccurrence(dow, hm.h, hm.m, nowDate);
    if (!shouldFireReminder(when, nowDate.getTime())) continue;

    const fireKey = `${PREFIX_FIRED(studentId)}sess_${s.id}_${when.toISOString()}`;
    if (sessionStorage.getItem(fireKey)) continue;
    sessionStorage.setItem(fireKey, "1");

    pushStudentNotification(studentId, {
      id: `sess-${s.id}-${when.getTime()}`,
      title: "Study session soon",
      message: `${s.subject} starts soon (${when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
      createdAt: new Date().toISOString(),
    });
  }

  for (const e of planner.schedule ?? []) {
    const dow = plannerDayToIndex(e.day);
    if (dow == null) continue;
    const hm = parseStartHm(e.time);
    if (!hm) continue;

    const when = nextWeeklyOccurrence(dow, hm.h, hm.m, nowDate);
    if (!shouldFireReminder(when, nowDate.getTime())) continue;

    const fireKey = `${PREFIX_FIRED(studentId)}sch_${e.id}_${when.toISOString()}`;
    if (sessionStorage.getItem(fireKey)) continue;
    sessionStorage.setItem(fireKey, "1");

    pushStudentNotification(studentId, {
      id: `sch-${e.id}-${when.getTime()}`,
      title: "Scheduled class soon",
      message: `${e.subject}: ${when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${e.day})`,
      createdAt: new Date().toISOString(),
    });
  }

  window.dispatchEvent(new CustomEvent("student-notifications-changed"));
}
