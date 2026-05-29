import api from "@/services/api";

export interface PlannerScheduleEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  topic: string;
}

export interface PlannerExamEntry {
  id: string;
  subject: string;
  date: string;
  chapters: string;
}

export interface PlannerSessionEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  topic: string;
  completed: boolean;
  generated: boolean;
}

export interface PlannerData {
  schedule: PlannerScheduleEntry[];
  exams: PlannerExamEntry[];
  autoPlan: PlannerSessionEntry[];
}

type RawPlannerEntry = {
  id?: number | string | null;
  day?: string | null;
  time?: string | null;
  subject?: string | null;
  topic?: string | null;
};

type RawPlannerExam = {
  id?: number | string | null;
  subject?: string | null;
  date?: string | null;
  chapters?: string | null;
};

type RawPlannerSession = RawPlannerEntry & {
  completed?: boolean | null;
  generated?: boolean | null;
};

type RawPlannerData = {
  scheduleEntries?: RawPlannerEntry[] | null;
  exams?: RawPlannerExam[] | null;
  autoPlan?: RawPlannerSession[] | null;
};

const toId = (value: number | string | null | undefined) => String(value ?? "");

const mapScheduleEntry = (item: RawPlannerEntry): PlannerScheduleEntry => ({
  id: toId(item.id),
  day: item.day ?? "Mon",
  time: item.time ?? "08:00",
  subject: item.subject ?? "Study",
  topic: item.topic ?? "",
});

const mapExam = (item: RawPlannerExam): PlannerExamEntry => ({
  id: toId(item.id),
  subject: item.subject ?? "Exam",
  date: item.date ?? "",
  chapters: item.chapters ?? "",
});

const mapSession = (item: RawPlannerSession): PlannerSessionEntry => ({
  id: toId(item.id),
  day: item.day ?? "Mon",
  time: item.time ?? "08:00",
  subject: item.subject ?? "Study",
  topic: item.topic ?? "",
  completed: Boolean(item.completed),
  generated: Boolean(item.generated),
});

export const getPlannerData = async (studentId: number) => {
  const { data } = await api.get(`/students/${studentId}/planner`);
  const planner = (data ?? {}) as RawPlannerData;

  return {
    schedule: (planner.scheduleEntries ?? []).map(mapScheduleEntry),
    exams: (planner.exams ?? []).map(mapExam),
    autoPlan: (planner.autoPlan ?? []).map(mapSession),
  } satisfies PlannerData;
};

export const createPlannerScheduleEntry = async (
  studentId: number,
  payload: Omit<PlannerScheduleEntry, "id">
) => {
  const { data } = await api.post(`/students/${studentId}/planner/schedule`, payload);
  return mapScheduleEntry((data ?? {}) as RawPlannerEntry);
};

export const updatePlannerScheduleEntry = async (
  studentId: number,
  entryId: string,
  payload: Omit<PlannerScheduleEntry, "id">
) => {
  const { data } = await api.put(`/students/${studentId}/planner/schedule/${entryId}`, payload);
  return mapScheduleEntry((data ?? {}) as RawPlannerEntry);
};

export const deletePlannerScheduleEntry = async (studentId: number, entryId: string) => {
  await api.delete(`/students/${studentId}/planner/schedule/${entryId}`);
};

export const createPlannerExam = async (
  studentId: number,
  payload: Omit<PlannerExamEntry, "id">
) => {
  const { data } = await api.post(`/students/${studentId}/planner/exams`, payload);
  return mapExam((data ?? {}) as RawPlannerExam);
};

export const deletePlannerExam = async (studentId: number, examId: string) => {
  await api.delete(`/students/${studentId}/planner/exams/${examId}`);
};

export const generatePlannerSessions = async (studentId: number) => {
  const { data } = await api.post(`/students/${studentId}/planner/generate`);
  return Array.isArray(data) ? data.map((item) => mapSession(item as RawPlannerSession)) : [];
};

export const createPlannerSession = async (
  studentId: number,
  payload: Omit<PlannerSessionEntry, "id" | "generated">
) => {
  const { data } = await api.post(`/students/${studentId}/planner/sessions`, payload);
  return mapSession((data ?? {}) as RawPlannerSession);
};

export const updatePlannerSession = async (
  studentId: number,
  sessionId: string,
  payload: Omit<PlannerSessionEntry, "id" | "generated">
) => {
  const { data } = await api.put(`/students/${studentId}/planner/sessions/${sessionId}`, payload);
  return mapSession((data ?? {}) as RawPlannerSession);
};

export const updatePlannerSessionCompletion = async (
  studentId: number,
  sessionId: string,
  completed: boolean
) => {
  const { data } = await api.patch(`/students/${studentId}/planner/sessions/${sessionId}/completion`, {
    completed,
  });
  return mapSession((data ?? {}) as RawPlannerSession);
};

export const deletePlannerSession = async (studentId: number, sessionId: string) => {
  await api.delete(`/students/${studentId}/planner/sessions/${sessionId}`);
};
