import api from "@/services/api";

type RawOption = {
  id?: number | string | null;
  name?: string | null;
  title?: string | null;
  label?: string | null;
  value?: string | null;
};

type RawTeacher = RawOption & {
  fullName?: string | null;
  userT?: {
    id?: number | string | null;
    name?: string | null;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

type RawCourse = {
  id?: number | string | null;
  title?: string | null;
  description?: string | null;
  published?: boolean | null;
  createdAt?: string | null;
  subjectName?: string | null;
  yearName?: string | null;
  streamName?: string | null;
  substreamName?: string | null;
  year?: RawOption | string | null;
  stream?: RawOption | string | null;
  substream?: RawOption | string | null;
  subject?: RawOption | string | null;
  teacher?: RawTeacher | null;
  lesson?: unknown[] | null;
  lessons?: unknown[] | null;
  lessonsCount?: number | null;
  quizzesCount?: number | null;
  enrollments?: unknown[] | null;
  enrolledCount?: number | null;
};

type RawLesson = {
  id?: number | string | null;
  title?: string | null;
  content?: string | null;
  orderNumber?: number | null;
  courseId?: number | string | null;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  resource?: {
    id?: number | string | null;
    videoUrl?: string | null;
    pdfUrl?: string | null;
  } | null;
  courses?: {
    id?: number | string | null;
  } | null;
};

export interface Course {
  id: number;
  title: string;
  description: string;
  published: boolean;
  createdAt: string;
  subject: string;
  year: string;
  stream: string;
  substream: string;
  teacherId: number | null;
  teacherName: string;
  lessonsCount: number;
  quizzesCount: number;
  enrolledCount: number;
}

export interface Lesson {
  id: number;
  title: string;
  content: string;
  orderNumber: number;
  courseId: number | null;
  videoUrl: string;
  pdfUrl: string;
}

export interface CoursePayload {
  title: string;
  description?: string;
  published?: boolean;
  year?: string;
  streamId?: number;
  substreamId?: number;
  subjectId?: number;
  teacherId?: number;
}

export interface LessonPayload {
  title: string;
  content?: string;
  orderNumber?: number;
  courseId?: number;
}

const getLabel = (value: RawOption | string | null | undefined) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  return (
    value.name ??
    value.title ??
    value.label ??
    value.value ??
    (value.id !== undefined && value.id !== null ? String(value.id) : "")
  );
};

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const normalizeCourse = (course: RawCourse): Course => {
  const teacherId =
    course.teacher?.id !== undefined && course.teacher?.id !== null
      ? toNumber(course.teacher.id)
      : course.teacher?.userT?.id !== undefined && course.teacher?.userT?.id !== null
        ? toNumber(course.teacher.userT.id)
      : null;

  return {
    id: toNumber(course.id),
    title: course.title ?? "Untitled course",
    description: course.description ?? "",
    published: Boolean(course.published),
    createdAt: course.createdAt ?? "",
    subject: course.subjectName ?? getLabel(course.subject),
    year: course.yearName ?? getLabel(course.year),
    stream: course.streamName ?? getLabel(course.stream),
    substream: course.substreamName ?? getLabel(course.substream ?? course.subject),
    teacherId,
    teacherName:
      course.teacher?.fullName ??
      course.teacher?.userT?.fullName ??
      course.teacher?.name ??
      course.teacher?.userT?.name ??
      course.teacher?.title ??
      "Teacher",
    lessonsCount: course.lessonsCount ??
      (Array.isArray(course.lesson)
        ? course.lesson.length
        : Array.isArray(course.lessons)
          ? course.lessons.length
          : 0),
    quizzesCount: course.quizzesCount ?? 0,
    enrolledCount: course.enrolledCount ?? (Array.isArray(course.enrollments) ? course.enrollments.length : 0),
  };
};

const normalizeLesson = (lesson: RawLesson): Lesson => ({
  id: toNumber(lesson.id),
  title: lesson.title ?? "Untitled lesson",
  content: lesson.content ?? "",
  orderNumber: lesson.orderNumber ?? 0,
  videoUrl: lesson.resource?.videoUrl ?? lesson.videoUrl ?? "",
  pdfUrl: lesson.resource?.pdfUrl ?? lesson.pdfUrl ?? "",
  courseId:
    lesson.courseId !== undefined && lesson.courseId !== null
      ? toNumber(lesson.courseId)
      : lesson.courses?.id !== undefined && lesson.courses?.id !== null
      ? toNumber(lesson.courses.id)
      : null,
});

const normalizeCourseList = (data: unknown) => {
  const list =
    Array.isArray((data as { content?: RawCourse[] })?.content)
      ? (data as { content: RawCourse[] }).content
      : Array.isArray(data)
        ? (data as RawCourse[])
        : [];

  return list.map(normalizeCourse);
};

export const getCourses = async (page = 0, size = 10) => {
  const { data } = await api.get("/courses", { params: { page, size } });
  return normalizeCourseList(data);
};

export const getCourseById = async (id: number) => {
  const { data } = await api.get(`/courses/${id}`);
  return normalizeCourse(data);
};

export const createCourse = async (course: CoursePayload) => {
  const { data } = await api.post("/courses", course);
  return normalizeCourse(data);
};

export const updateCourse = async (id: number, course: CoursePayload) => {
  await api.put(`/courses/${id}`, course);
};

export const deleteCourse = async (id: number) => {
  await api.delete(`/courses/${id}`);
};

export const publishCourse = async (id: number) => {
  const { data } = await api.post(`/courses/${id}/publish`);
  return normalizeCourse(data);
};

export const unpublishCourse = async (id: number) => {
  const { data } = await api.post(`/courses/${id}/unpublish`);
  return normalizeCourse(data);
};

export const getPopularCourses = async (
  studentId: number,
  page = 0,
  size = 10
) => {
  const { data } = await api.get(`/students/${studentId}/courses/popular`, {
    params: { page, size },
  });

  return normalizeCourseList(data);
};

export const getRecommendedCourses = async (studentId: number, page = 0, size = 10) => {
  const { data } = await api.get(`/students/${studentId}/courses/recommended`, {
    params: { page, size },
  });

  return normalizeCourseList(data);
};

export const getLatestCourses = async (studentId: number, page = 0, size = 10) => {
  const { data } = await api.get(`/students/${studentId}/courses/latest`, {
    params: { page, size },
  });

  return normalizeCourseList(data);
};

/** Paginated published courses with optional filters (years.id / stream / subject). */
export const discoverCourses = async (
  page = 0,
  size = 12,
  filters?: { streamId?: number | null; subjectId?: number | null; yearId?: number | null }
) => {
  const params: Record<string, number> = { page, size };
  if (filters?.streamId != null) params.streamId = filters.streamId;
  if (filters?.subjectId != null) params.subjectId = filters.subjectId;
  if (filters?.yearId != null) params.yearId = filters.yearId;
  const { data } = await api.get("/courses/discover", { params });
  return normalizeCourseList(data);
};

export const getLessonsByCourse = async (courseId: number) => {
  const { data } = await api.get(`/courses/${courseId}/lessons`);
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeLesson);
};

export const getLessonById = async (id: number) => {
  const { data } = await api.get(`/lessons/${id}`);
  return normalizeLesson(data);
};

export const createLesson = async (lesson: LessonPayload) => {
  if (lesson.courseId) {
    const { data } = await api.post(`/courses/${lesson.courseId}/lessons`, lesson);
    return normalizeLesson(data);
  }

  const { data } = await api.post("/lessons", lesson);
  return normalizeLesson(data);
};

export const updateLesson = async (lessonId: number, lesson: LessonPayload) => {
  const { data } = lesson.courseId
    ? await api.put(`/courses/${lesson.courseId}/lessons/${lessonId}`, lesson)
    : await api.put(`/lessons/${lessonId}`, { ...lesson, courseId: 0 });
  return normalizeLesson(data);
};

export const deleteLesson = async (lessonId: number, courseId?: number) => {
  if (courseId) {
    await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
    return;
  }

  await api.delete(`/lessons/${lessonId}`);
};
