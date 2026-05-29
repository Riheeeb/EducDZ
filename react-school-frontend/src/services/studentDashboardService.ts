import api from "@/services/api";
import type { Course } from "@/services/CourseService";

const API_ROOT = "http://localhost:8080";

type RawEnrollment = {
  id?: number | string | null;
  courseId?: number | string | null;
  courseTitle?: string | null;
  courseDescription?: string | null;
  progressPercent?: number | null;
  status?: string | null;
  enrolledAt?: string | null;
  courses?: {
    id?: number | string | null;
    title?: string | null;
    description?: string | null;
  } | null;
};

type RawStudentProfile = {
  studentId?: number | null;
  name?: string | null;
  email?: string | null;
  totalPoints?: number | null;
  totalBadges?: number | null;
  totalCompletedCourses?: number | null;
  totalEnrolledCourses?: number | null;
  totalActiveCourses?: number | null;
};

type RawStudentStats = {
  lessonsCompleted?: number | null;
  enrolledCourses?: number | null;
  points?: number | null;
};

type RawCourseProgress = {
  progressPercent?: number | null;
};

type RawBadgePage = {
  totalEarned?: number | null;
};

type RawSearchCourse = {
  id?: number | string | null;
  title?: string | null;
  description?: string | null;
};

type RawSearchTeacher = {
  id?: number | string | null;
  teacherId?: number | string | null;
  name?: string | null;
  teacherName?: string | null;
  courseCount?: number | null;
  publishedCourseCount?: number | null;
};

type RawSearchLesson = {
  id?: number | string | null;
  lessonId?: number | string | null;
  lessonTitle?: string | null;
  title?: string | null;
  snippet?: string | null;
  content?: string | null;
  courseId?: number | string | null;
  courseTitle?: string | null;
  courses?: {
    id?: number | string | null;
    title?: string | null;
  } | null;
};

type RawSearchResponse = {
  teachers?: RawSearchTeacher[] | null;
  courses?: RawSearchCourse[] | null;
  lessonsAndResources?: RawSearchLesson[] | null;
};

type RawContinueLearningLesson = {
  id?: number | string | null;
  title?: string | null;
  content?: string | null;
  orderNumber?: number | null;
  courseId?: number | string | null;
  courseTitle?: string | null;
  course?: {
    id?: number | string | null;
    title?: string | null;
  } | null;
};

export interface StudentEnrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  status: "in_progress" | "completed" | "dropped";
  progress: number;
  enrolledAt: string;
}

export interface StudentSummary {
  name: string;
  email: string;
  totalPoints: number;
  totalBadges: number;
  totalCompletedCourses: number;
  totalEnrolledCourses: number;
  totalActiveCourses: number;
}

export interface StudentStats {
  lessonsCompleted: number;
  enrolledCourses: number;
  points: number;
}

export interface SearchResults {
  teachers: Array<{
    id: number;
    name: string;
    courseCount: number;
  }>;
  courses: Array<Pick<Course, "id" | "title" | "description">>;
  lessons: Array<{
    id: number;
    title: string;
    description: string;
    courseId: number | null;
    courseTitle: string;
  }>;
}

export interface ContinueLearningLesson {
  id: number;
  title: string;
  content: string;
  orderNumber: number;
  courseId: number | null;
  courseTitle: string;
}

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const mapEnrollmentStatus = (status?: string | null): StudentEnrollment["status"] => {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "DROPPED":
      return "dropped";
    default:
      return "in_progress";
  }
};

export const getStudentEnrollments = async (studentId: number) => {
  const { data } = await api.get(`/students/${studentId}/enrollments`);
  const list = Array.isArray(data) ? (data as RawEnrollment[]) : [];

  return list.map<StudentEnrollment>((item) => ({
    id: toNumber(item.id),
    courseId: item.courseId != null ? toNumber(item.courseId) : toNumber(item.courses?.id),
    courseTitle: item.courseTitle ?? item.courses?.title ?? "Course",
    courseDescription: item.courseDescription ?? item.courses?.description ?? "",
    status: mapEnrollmentStatus(item.status),
    progress: item.progressPercent ?? 0,
    enrolledAt: item.enrolledAt ?? "",
  }));
};

export const getCourseEnrollment = async (studentId: number, courseId: number) => {
  const { data } = await api.get(`/students/${studentId}/enrollments/${courseId}`);
  const enrollment = (data ?? {}) as RawEnrollment;

  return {
    id: toNumber(enrollment.id),
    courseId: enrollment.courseId != null ? toNumber(enrollment.courseId) : courseId,
    courseTitle: enrollment.courseTitle ?? enrollment.courses?.title ?? "Course",
    courseDescription: enrollment.courseDescription ?? enrollment.courses?.description ?? "",
    status: mapEnrollmentStatus(enrollment.status),
    progress: enrollment.progressPercent ?? 0,
    enrolledAt: enrollment.enrolledAt ?? "",
  } satisfies StudentEnrollment;
};

export const getCourseProgress = async (studentId: number, courseId: number) => {
  const { data } = await api.get(`/courses/${courseId}/progress`, {
    params: { studentId },
  });
  const progress = (data ?? {}) as RawCourseProgress;
  return Math.round(progress.progressPercent ?? 0);
};

export const completeLesson = async (studentId: number, lessonId: number) => {
  await api.post(`/lessons/${lessonId}/complete`, null, {
    params: { studentId },
  });
};

export const getStudentSummary = async (studentId: number) => {
  const { data } = await api.get(`/students/${studentId}/profile`);
  const profile = (data ?? {}) as RawStudentProfile;

  return {
    name: profile.name ?? "Student",
    email: profile.email ?? "",
    totalPoints: profile.totalPoints ?? 0,
    totalBadges: profile.totalBadges ?? 0,
    totalCompletedCourses: profile.totalCompletedCourses ?? 0,
    totalEnrolledCourses: profile.totalEnrolledCourses ?? 0,
    totalActiveCourses: profile.totalActiveCourses ?? 0,
  } satisfies StudentSummary;
};

export const getStudentStats = async (studentId: number) => {
  const { data } = await api.get(`${API_ROOT}/api/me/stats`, { params: { studentId } });
  const stats = (data ?? {}) as RawStudentStats;

  return {
    lessonsCompleted: stats.lessonsCompleted ?? 0,
    enrolledCourses: stats.enrolledCourses ?? 0,
    points: stats.points ?? 0,
  } satisfies StudentStats;
};

export const getStudentBadgeTotal = async (studentId: number) => {
  const { data } = await api.get(`/badges/student/${studentId}`);
  const badgePage = (data ?? {}) as RawBadgePage;
  return badgePage.totalEarned ?? 0;
};

export const searchLearningContent = async (query: string) => {
  if (!query.trim()) {
    return { teachers: [], courses: [], lessons: [] } satisfies SearchResults;
  }

  const { data } = await api.get("/search", {
    params: { q: query, limit: 20 },
  });
  const response = (data ?? {}) as RawSearchResponse;

  return {
    teachers: (response.teachers ?? []).map((teacher) => ({
      id: toNumber(teacher.teacherId ?? teacher.id),
      name: teacher.teacherName ?? teacher.name ?? "Teacher",
      courseCount: teacher.publishedCourseCount ?? teacher.courseCount ?? 0,
    })),
    courses: (response.courses ?? []).map((course) => ({
      id: toNumber(course.id),
      title: course.title ?? "Course",
      description: course.description ?? "",
    })),
    lessons: (response.lessonsAndResources ?? []).map((lesson) => ({
      id: toNumber(lesson.lessonId ?? lesson.id),
      title: lesson.lessonTitle ?? lesson.title ?? "Lesson",
      description: lesson.snippet ?? lesson.content ?? "",
      courseId:
        lesson.courseId !== undefined && lesson.courseId !== null
          ? toNumber(lesson.courseId)
          : lesson.courses?.id !== undefined && lesson.courses?.id !== null
            ? toNumber(lesson.courses.id)
            : null,
      courseTitle: lesson.courseTitle ?? lesson.courses?.title ?? "",
    })),
  } satisfies SearchResults;
};

export const getContinueLearningLesson = async (studentId: number, courseId?: number) => {
  try {
    const { data } = await api.get("/continue-learning", {
      params: { studentId, courseId },
    });
    if (data == null || typeof data !== "object") {
      return null;
    }
    const lesson = data as RawContinueLearningLesson;

    return {
      id: toNumber(lesson.id),
      title: lesson.title ?? "Continue learning",
      content: lesson.content ?? "",
      orderNumber: lesson.orderNumber ?? 0,
      courseId:
        lesson.courseId != null
          ? toNumber(lesson.courseId)
          : lesson.course?.id != null
            ? toNumber(lesson.course.id)
            : null,
      courseTitle: lesson.courseTitle ?? lesson.course?.title ?? "",
    } satisfies ContinueLearningLesson;
  } catch {
    return null;
  }
};
