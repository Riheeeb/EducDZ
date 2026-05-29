import api from "@/services/api";

// ── raw backend shapes ─────────────────────────────────────────────────────

type RawTeacher = {
  id?: number | string | null;
  fullName?: string | null;
  name?: string | null;
};

type RawOption = {
  id?: number | string | null;
  name?: string | null;
  label?: string | null;
  value?: string | null;
};

type RawCourse = {
  id?: number | string | null;
  title?: string | null;
  description?: string | null;
  published?: boolean | null;
  createdAt?: string | null;
  yearId?: number | string | null;
  streamId?: number | string | null;
  substreamId?: number | string | null;
  yearName?: string | null;
  streamName?: string | null;
  substreamName?: string | null;
  year?: RawOption | string | null;
  stream?: RawOption | string | null;
  substream?: RawOption | string | null;
  studentLevel?: string | null;
  teacher?: RawTeacher | null;
  lesson?: unknown[] | null;
  lessons?: unknown[] | null;
  lessonsCount?: number | null;
  enrollments?: unknown[] | null;
  enrolledCount?: number | null;
};

type RawLesson = {
  id?: number | string | null;
  title?: string | null;
  content?: string | null;
  orderNumber?: number | null;
  teacherId?: number | string | null;
  courseId?: number | string | null;
  courseTitle?: string | null;
  resource?: { videoUrl?: string | null; pdfUrl?: string | null } | null;
};

type RawQuizQuestion = {
  id?: number | string | null;
  questionText?: string | null;
  type?: string | null;
  questionType?: string | null;
  options?: string[] | null;
  correctAnswer?: string | null;
};

type RawQuiz = {
  id?: number | string | null;
  title?: string | null;
  description?: string | null;
  quizType?: string | null;
  courseId?: number | string | null;
  courseTitle?: string | null;
  lessonId?: number | string | null;
  lessonTitle?: string | null;
  questionCount?: number | null;
  course?: { id?: number | string | null; title?: string | null } | null;
  lesson?: { id?: number | string | null; title?: string | null } | null;
  questions?: RawQuizQuestion[] | null;
};

type RawSubject = {
  id?: number | null;
  namesubject?: string | null;
};

type RawEnrollment = {
  id?: number | string | null;
  student?: {
    id?: number | string | null;
    userS?: { name?: string | null; email?: string | null } | null;
  } | null;
  progressPercent?: number | null;
  status?: string | null;
};

export type TeacherCourse = {
  id: number;
  title: string;
  description: string;
  studentLevel: string;  // MIDDLE_SCHOOL | HIGH_SCHOOL
  year: string;
  yearId?: number;
  stream: string;
  streamId?: number;
  substream: string;
  substreamId?: number;
  published: boolean;
  teacherName: string;
  createdAt: string;
  lessonsCount: number;
  enrolledCount: number;
};

export type TeacherLesson = {
  id: number;
  title: string;
  description: string;
  type: "video" | "pdf";
  url: string;
  courseId?: number;
  courseTitle?: string;
  orderNumber: number;
  teacherId?: number;
};

export type TeacherQuizQuestion = {
  id: string;
  question: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[];
  correctAnswer: number[] | string;
};

export type TeacherQuiz = {
  id: number;
  title: string;
  description: string;
  quizType: string;
  courseId?: number;
  courseTitle?: string;
  lessonId?: number;
  lessonTitle?: string;
  questions: TeacherQuizQuestion[];
};

export type SubjectOption = { id: number; name: string };
export type TeacherCourseOption = { id: number; title: string };

export type CourseStudent = {
  id: number;
  name: string;
  email: string;
  progressPercent: number;
  status: string;
};

export type TeacherNotification = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  courseId: number | null;
  studentId: number | null;
};

// dropdown option shapes used in the course form
export type YearOption = { id: number; label: string; year: string };
export type StreamOption = { id: number; namestream: string };
export type SubstreamOption = { id: number; nameSubstream: string };

// ── HELPERS ────────────────────────────────────────────────────────────────

const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getLabel = (value: RawOption | string | null | undefined): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name ?? value.label ?? value.value ?? (value.id != null ? String(value.id) : "");
};

const getId = (value: RawOption | string | null | undefined): number | undefined => {
  if (!value || typeof value === "string") return undefined;
  return value.id != null ? toNumber(value.id) : undefined;
};

const normalizeCourse = (course: RawCourse): TeacherCourse => ({
  id: toNumber(course.id),
  title: course.title ?? "Course",
  description: course.description ?? "",
  studentLevel: course.studentLevel ?? "",
  year: course.yearName ?? getLabel(course.year) ?? "",
  yearId: course.yearId != null ? toNumber(course.yearId) : getId(course.year),
  stream: course.streamName ?? getLabel(course.stream) ?? "",
  streamId: course.streamId != null ? toNumber(course.streamId) : getId(course.stream),
  substream: course.substreamName ?? getLabel(course.substream) ?? "",
  substreamId: course.substreamId != null ? toNumber(course.substreamId) : getId(course.substream),
  published: course.published === true,
  teacherName: course.teacher?.fullName ?? course.teacher?.name ?? "Teacher",
  createdAt: course.createdAt ?? "",
  lessonsCount: course.lessonsCount ?? (
    Array.isArray(course.lesson)
      ? course.lesson.length
      : Array.isArray(course.lessons)
        ? course.lessons.length
        : 0
  ),
  enrolledCount: course.enrolledCount ?? (Array.isArray(course.enrollments) ? course.enrollments.length : 0),
});

const normalizeLesson = (lesson: RawLesson): TeacherLesson | null => {
  console.log("normalizeLesson RAW INPUT:", JSON.stringify(lesson));
  const id = toNumber(lesson.id);
  if (id === 0) {
    console.warn("normalizeLesson: id is 0 or null", lesson);
    return null;
  }
  const resource = lesson.resource;
  const isPdf = resource?.pdfUrl != null && resource.pdfUrl !== "";
  const isVideo = resource?.videoUrl != null && resource.videoUrl !== "";
  const courseId = lesson.courseId != null ? toNumber(lesson.courseId) : undefined;
  const courseTitle = lesson.courseTitle ?? undefined;
  return {
    id,
    title: lesson.title ?? "Lesson",
    description: lesson.content ?? "",
    type: isPdf ? "pdf" : "video",
    url: isPdf ? resource.pdfUrl : isVideo ? resource.videoUrl : "",
    courseId: courseId !== 0 ? courseId : undefined,
    courseTitle,
    orderNumber: lesson.orderNumber ?? 0,
    teacherId: lesson.teacherId != null ? toNumber(lesson.teacherId) : undefined,
  };
};

const normalizeQuestionType = (type?: string | null): TeacherQuizQuestion["type"] => {
  switch (type) {
    case "TRUE_FALSE":
      return "true_false";
    case "SHORT_ANSWER":
      return "short_answer";
    default:
      return "mcq";
  }
};

const normalizeQuiz = (quiz: RawQuiz): TeacherQuiz => ({
  id: toNumber(quiz.id),
  title: quiz.title ?? "Quiz",
  description: quiz.description ?? "",
  quizType: quiz.quizType ?? "",
  courseId:
    (quiz.courseId != null ? toNumber(quiz.courseId) : undefined) ??
    (quiz.course?.id != null ? toNumber(quiz.course.id) : undefined),
  courseTitle: quiz.courseTitle ?? quiz.course?.title ?? undefined,
  lessonId:
    (quiz.lessonId != null ? toNumber(quiz.lessonId) : undefined) ??
    (quiz.lesson?.id != null ? toNumber(quiz.lesson.id) : undefined),
  lessonTitle: quiz.lessonTitle ?? quiz.lesson?.title ?? undefined,
  questions: Array.isArray(quiz.questions)
    ? quiz.questions.map((q, i) => {
        const type = normalizeQuestionType(q.type ?? q.questionType);
        
        
        const options = Array.isArray(q.options) 
          ? q.options.map((opt: any) => {
              if (typeof opt === "string") {
                return opt;
              }
              return opt?.optionText ?? "";
            })
          : [];
        
        let correctAnswer: number[] | string;
        if (type === "short_answer") {
          correctAnswer = q.correctAnswer ?? "";
        } else {
          correctAnswer = Array.isArray(q.correctAnswer)
            ? q.correctAnswer
            : [];
        }
        
        return {
          id: String(q.id ?? i),
          question: q.questionText ?? "",
          type,
          options,  
          correctAnswer,
        };
      })
    : [],
});
// ── DROPDOWN LOADERS ───────────────────────────────────────────────────────

export const getYearOptions = async (level?: string): Promise<YearOption[]> => {
  const { data } = await api.get("/years");
  console.log("RAW YEARS:", data);
  const list = Array.isArray(data) ? data : data?.content ?? [];

  return list
    .map((y: any) => {
      const name: string = y.name ?? y.year ?? String(y.id);
      const yearType = name.endsWith("AM")
        ? "MIDDLE_SCHOOL"
        : name.endsWith("AS")
          ? "HIGH_SCHOOL"
          : "";
      return { id: toNumber(y.id), label: name, yearType };
    })
    .filter((y) => {
      if (!level) return true;
      return y.yearType === level;
    });
};

export const getStreamsByYear = async (yearId: number): Promise<StreamOption[]> => {
  const { data } = await api.get(`/years/${yearId}/streams`);
  const list = Array.isArray(data) ? data : data?.content ?? [];
  return list.map((s: any) => ({
    id: toNumber(s.id),
    namestream: s.streamType?.namestream ?? s.namestream ?? s.name ?? String(s.id),
  }));
};

export const getSubstreamsByStream = async (
  streamId: number
): Promise<SubstreamOption[]> => {
  const { data } = await api.get(`/substreams/by-stream/${streamId}`);
  const list = Array.isArray(data) ? data : data?.content ?? [];
  return list.map((s: any) => ({
    id: toNumber(s.id),
    nameSubstream:
      s.nameSubstream ?? s.namesubstream ?? s.name ?? String(s.id),
  }));
};

// ── COURSE API ─────────────────────────────────────────────────────────────
// ── PAGINATED TEACHER COURSES (Public) ────────────────────────────────────

export type TeacherPublicCoursesResponse = {
  content: TeacherCourse[];
  totalElements: number;
  totalPages: number;
  number: number;        // current page index
  size: number;          // page size
  first: boolean;
  last: boolean;
};

export const getTeacherPublicCourses = async (
  teacherId: number,
  page: number = 0,
  size: number = 5
): Promise<TeacherPublicCoursesResponse> => {
  const { data } = await api.get(`/teachers/${teacherId}/courses`, {
    params: { page, size },
  });
  
  const response = data ?? {};
  const rawContent = Array.isArray(response.content) ? response.content : [];
  
  
  const content: TeacherCourse[] = rawContent.map((c: any) => ({
    id: toNumber(c.id),
    title: c.title ?? "Course",
    description: c.description ?? "",
    studentLevel: c.studentLevel ?? "",
    year: c.year ?? "",
    yearId: undefined,
    stream: c.stream ?? "",
    streamId: undefined,
    substream: c.substream ?? "",
    substreamId: undefined,
    published: c.published === true,
    teacherName: c.teacherName ?? "Teacher",
    createdAt: c.createdAt ?? "",
    lessonsCount: c.lessonsCount ?? 0,
    enrolledCount: c.enrolledCount ?? 0,
  }));

  return {
    content,
    totalElements: response.totalElements ?? content.length,
    totalPages: response.totalPages ?? 1,
    number: response.number ?? page,
    size: response.size ?? size,
    first: response.first ?? page === 0,
    last: response.last ?? true,
  };
};

/** All drafts + published for teacher dashboard cards (distinct from `/teachers/:id/courses` which is student-facing published-only). */
export const getAllTeacherCourses = async (teacherId: number): Promise<TeacherCourse[]> => {
  const { data } = await api.get(`/teachers/${teacherId}/courses/all`);
  const list = Array.isArray(data) ? data : [];
  return list.map((c: RawCourse) => normalizeCourse(c));
};

export const getTeacherCourseOptions = async (
  teacherId: number
): Promise<TeacherCourseOption[]> => {
  try {
    const { data } = await api.get(`/teachers/${teacherId}/courses/options`);
    const list = Array.isArray(data) ? data : [];
    return list.map((c: any) => ({
      id: toNumber(c?.id),
      title: c?.title ?? "Course",
    }));
  } catch {
    return [];
  }
};

export const createTeacherCourse = async (payload: {
  teacherId: number;
  subjectId: number;
  title: string;
  description: string;
  studentLevel: string;
  yearId: number;
  streamId?: number;
  substreamId?: number;
}): Promise<TeacherCourse> => {
  const body: any = {
    title: payload.title,
    description: payload.description,
    studentLevel: payload.studentLevel,
    teacherId: payload.teacherId,
    subjectId: payload.subjectId,
    yearId: payload.yearId,
    published: false,
  };

  if (payload.streamId) body.streamId = payload.streamId;
  if (payload.substreamId) body.substreamId = payload.substreamId;

  const { data } = await api.post("/courses", body);
  console.log("TEACHER COURSE RESPONSE:", data);
  return normalizeCourse(data);
};

export const updateTeacherCourse = async (
  courseId: number,
  payload: {
    title: string;
    description: string;
    studentLevel: string;
    yearId: number;
    streamId?: number;
    substreamId?: number;
    subjectId?: number;
  }
): Promise<void> => {
  const body: any = {
    title: payload.title,
    description: payload.description,
    studentLevel: payload.studentLevel,
    yearId: payload.yearId,
  };
  if (payload.streamId) body.streamId = payload.streamId;
  if (payload.substreamId) body.substreamId = payload.substreamId;
  if (payload.subjectId) body.subjectId = payload.subjectId;

  await api.put(`/courses/${courseId}`, body);
};

export const deleteTeacherCourse = async (courseId: number): Promise<void> => {
  await api.delete(`/courses/${courseId}`);
};

export const publishTeacherCourse = async (
  courseId: number,
  published: boolean
): Promise<void> => {
  if (published) {
    await api.post(`/courses/${courseId}/unpublish`);
  } else {
    await api.post(`/courses/${courseId}/publish`);
  }
};

// ── LESSON API ─────────────────────────────────────────────────────────────

export const getTeacherLessons = async (
  teacherId: number,
  teacherCourses: TeacherCourse[]
): Promise<TeacherLesson[]> => {
  try {
    const { data } = await api.get(`/teachers/${teacherId}/lessons`);
    console.log("TEACHER LESSONS RESPONSE:", data);
    const list = Array.isArray(data) ? (data as RawLesson[]) : [];
    return list
      .map(normalizeLesson)
      .filter((l): l is TeacherLesson => l !== null);
  } catch (error: any) {
    console.warn("getTeacherLessons fallback:", error);

    if (teacherCourses.length === 0) return [];
    const lessonLists = await Promise.all(
      teacherCourses.map(async (course) => {
        try {
          const { data } = await api.get(`/courses/${course.id}/lessons`);
          const list = Array.isArray(data) ? data : [];
          return list
            .map(normalizeLesson)
            .filter((l): l is TeacherLesson => l !== null);
        } catch {
          return [];
        }
      })
    );
    return lessonLists.flat();
  }
};

export const createTeacherLesson = async (payload: {
  title: string;
  description: string;
  type: "video" | "pdf";
  url: string;
  courseId?: number;
  teacherId: number;
}): Promise<TeacherLesson> => {
  if (!payload.url || payload.url.trim() === "") {
    throw new Error(
      "Please provide a resource URL or upload a file before saving."
    );
  }
  const body: any = {
    title: payload.title,
    content: payload.description,
    orderNumber: 1,
    teacherId: payload.teacherId,
    resource:
      payload.type === "pdf"
        ? { pdfUrl: payload.url.trim(), videoUrl: null }
        : { videoUrl: payload.url.trim(), pdfUrl: null },
  };

  if (payload.courseId) {
    body.courseId = payload.courseId;
  }

  const { data } = payload.courseId
    ? await api.post(`/courses/${payload.courseId}/lessons`, body)
    : await api.post("/lessons", body);

  console.log("LESSON BODY SENT:", JSON.stringify(body, null, 2));

  const normalized = normalizeLesson(data);
  if (!normalized) throw new Error("Failed to normalize lesson");
  return normalized;
};

export const updateTeacherLesson = async (
  lessonId: number,
  payload: {
    title: string;
    description: string;
    type: "video" | "pdf";
    url: string;
    courseId?: number;
  }
): Promise<TeacherLesson> => {
  if (lessonId <= 0) throw new Error("Invalid lesson ID");
  const body = {
    title: payload.title,
    content: payload.description,
    courseId: payload.courseId ?? 0,
    resource:
      payload.type === "pdf"
        ? { pdfUrl: payload.url }
        : { videoUrl: payload.url },
  };
  const { data } = payload.courseId
    ? await api.put(`/courses/${payload.courseId}/lessons/${lessonId}`, body)
    : await api.put(`/lessons/${lessonId}`, body);
  const normalized = normalizeLesson(data);
  if (!normalized) throw new Error("Failed to normalize updated lesson");
  return normalized;
};

export const deleteTeacherLesson = async (
  lessonId: number,
  courseId?: number
): Promise<void> => {
  if (courseId) {
    await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
  } else {
    await api.delete(`/lessons/${lessonId}`);
  }
};

// ── QUIZ API ───────────────────────────────────────────────────────────────

export const getTeacherQuizzes = async (
  teacherId: number
): Promise<TeacherQuiz[]> => {
  const { data } = await api.get(`/teachers/${teacherId}/quizzes`);
  console.log("QUIZZES RESPONSE:", data);
  const list = Array.isArray(data) ? (data as RawQuiz[]) : [];
  return list.map(normalizeQuiz);
};

const mapQuestionType = (type: TeacherQuizQuestion["type"]): string => {
  switch (type) {
    case "true_false":
      return "TRUE_FALSE";
    case "short_answer":
      return "SHORT_ANSWER";
    default:
      return "MULTIPLE_CHOICE";
  }
};

// ✅ Fixed: Supports both number[] (multiple answers) and string (short answer)
const mapCorrectAnswer = (q: TeacherQuizQuestion): number[] | string => {
  if (q.type === "short_answer" || typeof q.correctAnswer === "string") {
    return String(q.correctAnswer);
  }
  // For MCQ and True/False: keep as number[] array
  return Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
};

export const createTeacherQuiz = async (payload: {
  title: string;
  courseId?: number;
  lessonId?: number;
  questions: TeacherQuizQuestion[];
}): Promise<TeacherQuiz> => {
  const body = {
    title: payload.title,
    description: "",
    lessonId: payload.lessonId,
    courseId: payload.courseId,
    totalPoints: Math.max(payload.questions.length * 10, 10),
    showCorrectAnswers: true,
    questions: payload.questions.map((q, i) => ({
      questionText: q.question,
      type: mapQuestionType(q.type),
      points: 10,
      orderNumber: i + 1,
      options:
        q.type === "short_answer"
          ? []
          : q.options.map((opt, idx) => ({
              optionText: opt,
              optionIndex: idx,
            })),
      correctAnswer: mapCorrectAnswer(q), // ✅ Supports multiple answers
    })),
  };
  console.log("QUIZ BODY SENT:", JSON.stringify(body, null, 2));
  const { data } = await api.post("/quizzes", body);
  return normalizeQuiz(data);
};

export const updateTeacherQuiz = async (
  quizId: number,
  payload: {
    title: string;
    courseId?: number;
    lessonId?: number;
    questions: TeacherQuizQuestion[];
  }
): Promise<TeacherQuiz> => {
  const body = {
    title: payload.title,
    description: "",
    lessonId: payload.lessonId,
    courseId: payload.courseId,
    totalPoints: Math.max(payload.questions.length * 10, 10),
    showCorrectAnswers: true,
    questions: payload.questions.map((q, i) => ({
      questionText: q.question,
      type: mapQuestionType(q.type),
      points: 10,
      orderNumber: i + 1,
      options:
        q.type === "short_answer"
          ? []
          : q.options.map((opt, idx) => ({
              optionText: opt,
              optionIndex: idx,
            })),
      correctAnswer: mapCorrectAnswer(q), // ✅ Supports multiple answers
    })),
  };
  console.log("QUIZ BODY SENT:", JSON.stringify(body, null, 2));
  const { data } = await api.put(`/quizzes/${quizId}`, body);
  return normalizeQuiz(data);
};

export const deleteTeacherQuiz = async (quizId: number): Promise<void> => {
  await api.delete(`/quizzes/${quizId}`);
};

// ── STUDENTS & SUBJECTS ────────────────────────────────────────────────────

export const getCourseStudents = async (
  courseId: number
): Promise<CourseStudent[]> => {
  const { data } = await api.get(`/courses/${courseId}/enrollments`);
  const list = Array.isArray(data) ? (data as RawEnrollment[]) : [];
  return list.map((e) => ({
    id: toNumber(e.student?.id),
    name: e.student?.userS?.name ?? `Student ${e.student?.id ?? ""}`,
    email: e.student?.userS?.email ?? "",
    progressPercent: e.progressPercent ?? 0,
    status: e.status ?? "",
  }));
};

export const getSubjectOptions = async (): Promise<SubjectOption[]> => {
  const { data } = await api.get("/subjects");
  const list = Array.isArray(data) ? (data as RawSubject[]) : [];
  return list.map((s) => ({ id: s.id ?? 0, name: s.namesubject ?? "" }));
};

export const getTeacherNotifications = async (
  teacherId: number
): Promise<TeacherNotification[]> => {
  const { data } = await api.get(`/teachers/${teacherId}/notifications`);
  const list = Array.isArray(data) ? data : [];
  return list.map((notification: any) => ({
    id: toNumber(notification.id),
    title: notification.title ?? "Notification",
    message: notification.message ?? "",
    read: notification.read === true,
    createdAt: notification.createdAt ?? "",
    courseId:
      notification.courseId !== undefined && notification.courseId !== null
        ? toNumber(notification.courseId)
        : null,
    studentId:
      notification.studentId !== undefined && notification.studentId !== null
        ? toNumber(notification.studentId)
        : null,
  }));
};

// ── RESOURCE UPLOAD ────────────────────────────────────────────────────────

export const uploadTeacherResource = async (
  file: File
): Promise<{ url: string; nameUrl: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/resources/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const url =
    data?.url ??
    data?.fileUrl ??
    data?.pdfUrl ??
    data?.videoUrl ??
    data?.downloadUrl ??
    "";
  if (!url) throw new Error("Upload succeeded but no public URL was returned");
  return { url, nameUrl: data?.nameUrl ?? data?.name ?? file.name };
};
