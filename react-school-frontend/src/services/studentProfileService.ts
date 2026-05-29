import api from "@/services/api";

export interface ProfileCourseCard {
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  teacherName: string;
  enrollmentDate: string;
  completionDate: string;
  status: string;
  progressPercent: number;
  pointsEarned: number;
}

export interface ProfileYearCard {
  yearLabel: string;
  studentLevel: string;
  academicPeriod: string;
  stream: string;
  substream: string;
  totalEnrolledCourses: number;
  totalCompletedCourses: number;
  /** Lessons completed in this academic year (per backend profile). */
  lessonsCompleted: number;
  pointsEarned: number;
  badgesEarned: number;
  courses: ProfileCourseCard[];
}

export interface StudentProfileDetails {
  studentId: number;
  name: string;
  email: string;
  currentYearLabel: string;
  studyLevelLabel: string;
  totalPoints: number;
  totalEnrolledCourses: number;
  totalCompletedCourses: number;
  totalActiveCourses: number;
  pointsToNext: number;
  totalBadges: number;
  studentLevel: string;
  streamId: number | null;
  yearId: number | null;
  substreamId: number | null;
  yearHistory: ProfileYearCard[];
}

type RawCourse = {
  courseId?: number | null;
  courseTitle?: string | null;
  courseDescription?: string | null;
  teacherName?: string | null;
  enrollmentDate?: string | null;
  completionDate?: string | null;
  status?: string | null;
  progressPercent?: number | null;
  pointsEarned?: number | null;
};

type RawYear = {
  yearLabel?: string | null;
  studentLevel?: string | null;
  academicPeriod?: string | null;
  stream?: string | null;
  substream?: string | null;
  totalEnrolledCourses?: number | null;
  totalCompletedCourses?: number | null;
  lessonsCompleted?: number | null;
  pointsEarned?: number | null;
  badgesEarned?: number | null;
  courses?: RawCourse[] | null;
};

type RawProfile = {
  studentId?: number | null;
  name?: string | null;
  email?: string | null;
  currentYearLabel?: string | null;
  studyLevelLabel?: string | null;
  totalPoints?: number | null;
  totalEnrolledCourses?: number | null;
  totalCompletedCourses?: number | null;
  totalActiveCourses?: number | null;
  pointsToNext?: number | null;
  totalBadges?: number | null;
  studentLevel?: string | null;
  streamId?: number | null;
  yearId?: number | null;
  substreamId?: number | null;
  yearHistory?: RawYear[] | null;
};

const normalizeCourse = (course: RawCourse): ProfileCourseCard => ({
  courseId: course.courseId ?? 0,
  courseTitle: course.courseTitle ?? "Course",
  courseDescription: course.courseDescription ?? "",
  teacherName: course.teacherName ?? "Teacher",
  enrollmentDate: course.enrollmentDate ?? "",
  completionDate: course.completionDate ?? "",
  status: course.status ?? "ACTIVE",
  progressPercent: course.progressPercent ?? 0,
  pointsEarned: course.pointsEarned ?? 0,
});


const normalizeYear = (year: RawYear): ProfileYearCard => ({
  yearLabel: year.yearLabel ?? "",
  studentLevel: year.studentLevel ?? "",
  academicPeriod: year.academicPeriod ?? "",
  stream: year.stream ?? "",
  substream: year.substream ?? "",
  totalEnrolledCourses: year.totalEnrolledCourses ?? 0,
  totalCompletedCourses: year.totalCompletedCourses ?? 0,
  lessonsCompleted: year.lessonsCompleted ?? 0,
  pointsEarned: year.pointsEarned ?? 0,
  badgesEarned: year.badgesEarned ?? 0,
  courses: Array.isArray(year.courses) ? year.courses.map(normalizeCourse) : [],
});

export const getStudentProfileDetails = async (studentId: number) => {
  try {
    const { data } = await api.get(`/students/${studentId}/profile`);
    const profile = (data ?? {}) as RawProfile;

    // Ensure name is fetched from backend - it should be in the profile data
    const studentName = profile.name && profile.name.trim() !== "" 
      ? profile.name 
      : "Student"; // Fallback only if backend doesn't provide name

    return {
      studentId: profile.studentId ?? studentId,
      name: studentName,
      email: profile.email ?? "",
      currentYearLabel: profile.currentYearLabel ?? "",
      studyLevelLabel: profile.studyLevelLabel ?? "",
      totalPoints: profile.totalPoints ?? 0,
      totalEnrolledCourses: profile.totalEnrolledCourses ?? 0,
      totalCompletedCourses: profile.totalCompletedCourses ?? 0,
      totalActiveCourses: profile.totalActiveCourses ?? 0,
      pointsToNext: profile.pointsToNext ?? 0,
      totalBadges: profile.totalBadges ?? 0,
      studentLevel: profile.studentLevel ?? "",
      streamId: profile.streamId ?? null,
      yearId: profile.yearId ?? null,
      substreamId: profile.substreamId ?? null,
      yearHistory: Array.isArray(profile.yearHistory)
        ? profile.yearHistory.map(normalizeYear)
        : [],
    } satisfies StudentProfileDetails;
  } catch (error) {
    console.error("Failed to fetch student profile details:", error);
    throw error;
  }
};