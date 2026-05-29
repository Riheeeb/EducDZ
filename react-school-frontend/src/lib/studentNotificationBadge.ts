import api from "@/services/api";
import { countUnreadStudentNotifications } from "@/lib/studentPlannerNotifications";

/** Server-persisted rows (badges, etc.). */
export async function fetchUnreadServerNotificationCount(studentId: number): Promise<number> {
  if (!studentId) return 0;
  try {
    const { data } = await api.get(`/students/${studentId}/notifications`);
    const list = Array.isArray(data) ? data : [];
    return list.filter((n: { read?: boolean }) => !n.read).length;
  } catch {
    return 0;
  }
}

/** Planner sessionStorage + API unread badge count for the bell. */
export async function getTotalStudentUnreadNotificationCount(studentId: number): Promise<number> {
  const local = countUnreadStudentNotifications(studentId);
  const server = await fetchUnreadServerNotificationCount(studentId);
  return local + server;
}
