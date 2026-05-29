import api from "@/services/api";

export const adminApi = {
  // ── stats ──────────────────────────────────────────────────────────
  getStats: () =>
    api.get("/admin/stats").then((r) => r.data),
 
  // ── users ──────────────────────────────────────────────────────────
  getUsers: (page: number, size: number) =>
    api.get(`/admin/users?page=${page}&size=${size}`).then((r) => r.data),
 
  getStudents: (page: number, size: number) =>
    api.get(`/admin/students?page=${page}&size=${size}`).then((r) => r.data),
 
  getTeachers: (page: number, size: number) =>
    api.get(`/admin/teachers?page=${page}&size=${size}`).then((r) => r.data),
 
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),
 
  banUser: (id: string) =>
    api.put(`/admin/users/${id}/ban`).then((r) => r.data),
 
  unbanUser: (id: string) =>
    api.put(`/admin/users/${id}/unban`).then((r) => r.data),
 
  // ── courses ────────────────────────────────────────────────────────
  getCourses: (page: number, size: number) =>
    api.get(`/admin/courses?page=${page}&size=${size}`).then((r) => r.data),
 
  deleteCourse: (id: string) =>
    api.delete(`/admin/courses/${id}`).then((r) => r.data),
 
  unpublishCourse: (id: string) =>
    api.put(`/admin/courses/${id}/unpublish`).then((r) => r.data),
 
  // ── subjects ───────────────────────────────────────────────────────
  getSubjects: () =>
    api.get("/admin/subjects").then((r) => r.data),
 
  createSubject: (body: { name: string }) =>
    api.post("/admin/subjects", body).then((r) => r.data),
 
  renameSubject: (id: string, name: string) =>
    api.put(`/admin/subjects/${id}`, { name }).then((r) => r.data),
 
  // ── years ──────────────────────────────────────────────────────────
  getYears: () =>
    api.get("/admin/years").then((r) => r.data),

  // ── streams ────────────────────────────────────────────────────────
  getStreams: () =>
    api.get("/admin/streams").then((r) => r.data),
 
  createStream: (body: object) =>
    api.post("/admin/streams", body).then((r) => r.data),
 
  // ── badges ─────────────────────────────────────────────────────────
  getBadges: () =>
    api.get("/admin/badges").then((r) => r.data),
 
  createBadge: (body: object) =>
    api.post("/admin/badges", body).then((r) => r.data),
 
  updateBadge: (id: string, body: object) =>
    api.put(`/admin/badges/${id}`, body).then((r) => r.data),
 
  deleteBadge: (id: string) =>
    api.delete(`/admin/badges/${id}`).then((r) => r.data),
};
