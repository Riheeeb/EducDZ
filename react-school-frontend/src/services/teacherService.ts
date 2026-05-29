import api from "@/services/api";
import type { Course } from "@/services/CourseService";

export interface TeacherProfile {
  id: number;
  name: string;
  email: string;
  subject: string;
  totalPublishedCourses: number;
  totalCourses: number;
  totalLessons: number;
  courses: Course[];
}


export const getTeacherProfile = async (teacherId: number) => {
  const { data } = await api.get(`/teachers/${teacherId}/profile`);
  return data as TeacherProfile;
};


