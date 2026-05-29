import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Bell,
  BellOff,
  BookOpen,
  CheckCheck,
  Clock,
  GraduationCap,
  Loader2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUser } from "@/services/authStorage";
import { getTeacherNotifications, type TeacherNotification } from "@/services/teacherDashboardService";

// ── helpers ────────────────────────────────────────────────────────────────

const timeAgo = (iso: string): string => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// ── Notification type classifier ───────────────────────────────────────────
// Teacher notifications: triggered by student actions (enrollment, progress)
// Student notifications: triggered by system events (session reminder, badge)

type NotifCategory = "teacher" | "student";

const classifyNotification = (n: TeacherNotification): NotifCategory => {
  const title = (n.title ?? "").toLowerCase();
  const message = (n.message ?? "").toLowerCase();

  // Student-facing triggers
  if (
    title.includes("badge") ||
    title.includes("session") ||
    title.includes("reminder") ||
    title.includes("start") ||
    message.includes("badge") ||
    message.includes("session") ||
    message.includes("10 min") ||
    message.includes("starting soon")
  ) {
    return "student";
  }

  // Teacher-facing triggers (enrollment, course activity, student joined)
  if (
    n.studentId ||
    title.includes("enrolled") ||
    title.includes("enrollment") ||
    title.includes("joined") ||
    message.includes("enrolled") ||
    message.includes("joined your course")
  ) {
    return "teacher";
  }

  // Fallback: if it has a courseId and no student signals, treat as teacher
  return n.courseId ? "teacher" : "student";
};

const CATEGORY_META: Record<
  NotifCategory,
  { label: string; color: string; bg: string; border: string; dotColor: string; iconBg: string; iconColor: string }
> = {
  teacher: {
    label: "Teacher",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dotColor: "bg-blue-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  student: {
    label: "Student",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dotColor: "bg-violet-500",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
};

const NotificationIcon = ({ n, category }: { n: TeacherNotification; category: NotifCategory }) => {
  if (category === "student") {
    const title = (n.title ?? "").toLowerCase();
    if (title.includes("badge")) return <Award className="h-4 w-4" />;
    if (title.includes("session") || title.includes("reminder") || title.includes("start"))
      return <Clock className="h-4 w-4" />;
    return <GraduationCap className="h-4 w-4" />;
  }
  // teacher
  if (n.studentId) return <Users className="h-4 w-4" />;
  if (n.courseId) return <BookOpen className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
};

// ── localStorage helpers ───────────────────────────────────────────────────

const storageKey = (teacherId: number) => `notif_read_ids_${teacherId}`;

const loadReadIds = (teacherId: number): Set<number> => {
  try {
    const raw = localStorage.getItem(storageKey(teacherId));
    const parsed = raw ? (JSON.parse(raw) as number[]) : [];
    return new Set(parsed);
  } catch {
    return new Set();
  }
};

const saveReadIds = (teacherId: number, ids: Set<number>) => {
  try {
    localStorage.setItem(storageKey(teacherId), JSON.stringify([...ids]));
  } catch {
    // storage full or unavailable — fail silently
  }
};

// ── enriched notification type ─────────────────────────────────────────────

type RichNotification = TeacherNotification & { category: NotifCategory };

// ── component ──────────────────────────────────────────────────────────────

type ReadFilter = "all" | "unread" | "read";
type CategoryFilter = "all" | "teacher" | "student";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const teacherId = user?.userId;

  const [notifications, setNotifications] = useState<RichNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    if (!teacherId) {
      navigate("/login");
      return;
    }
    getTeacherNotifications(teacherId)
      .then((fetched) => {
        const readIds = loadReadIds(teacherId);
        const merged: RichNotification[] = fetched.map((n) => ({
          ...n,
          read: n.read || readIds.has(n.id),
          category: classifyNotification(n),
        }));
        setNotifications(merged);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [teacherId]);

  // Persist read IDs whenever notifications change
  useEffect(() => {
    if (!teacherId || notifications.length === 0) return;
    const readIds = new Set(notifications.filter((n) => n.read).map((n) => n.id));
    saveReadIds(teacherId, readIds);
  }, [notifications, teacherId]);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // Only marks as read — never toggles back
  const markOne = (id: number) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const filtered = notifications.filter((n) => {
    const matchRead =
      readFilter === "all" || (readFilter === "unread" ? !n.read : n.read);
    const matchCategory =
      categoryFilter === "all" || n.category === categoryFilter;
    return matchRead && matchCategory;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const teacherUnread = notifications.filter((n) => !n.read && n.category === "teacher").length;
  const studentUnread = notifications.filter((n) => !n.read && n.category === "student").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">

      {/* ── header ── */}
      <header className="sticky top-0 z-20 border-b border-green-100 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full hover:bg-green-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <GraduationCap
              className="h-9 w-9 bg-green-200 text-green-600 rounded-full p-1.5 cursor-pointer"
              onClick={() => navigate("/teacher-dashboard")}
            />
            <span className="text-lg font-bold text-gray-800 hidden sm:block">EducDZ</span>
          </div>

          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" />
            <h1 className="text-base font-semibold text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="rounded-full bg-green-600 text-white text-xs px-2">
                {unreadCount}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="rounded-full text-green-700 hover:bg-green-100 text-xs gap-1.5 disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* ── summary cards ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Teacher card */}
          <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Teacher Alerts</p>
              <p className="text-sm font-bold text-gray-800">
                Enrollment & course activity
              </p>
            </div>
            {teacherUnread > 0 && (
              <Badge className="ml-auto rounded-full bg-blue-500 text-white text-xs px-2 shrink-0">
                {teacherUnread}
              </Badge>
            )}
          </div>

          
        </div>

        {/* ── filters row ── */}
        <div className="flex flex-wrap gap-2">
          {/* Category filters */}
          <div className="flex gap-1.5 bg-white border border-gray-100 rounded-full px-1.5 py-1 shadow-sm">
            {(["all", "teacher", "student"] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  categoryFilter === cat
                    ? cat === "teacher"
                      ? "bg-blue-500 text-white"
                      : cat === "student"
                      ? "bg-violet-500 text-white"
                      : "bg-green-600 text-white"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {cat === "all" ? "All types" : cat === "teacher" ? "👨‍🏫 Teacher" : "🎓 Student"}
              </button>
            ))}
          </div>

          {/* Read-state filters */}
          <div className="flex gap-1.5 bg-white border border-gray-100 rounded-full px-1.5 py-1 shadow-sm">
            {(["all", "unread", "read"] as ReadFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setReadFilter(tab)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  readFilter === tab
                    ? "bg-green-600 text-white"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab}
                {tab === "unread" && unreadCount > 0 && (
                  <span className="ml-1">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-green-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-gray-500">Loading notifications…</p>
          </div>
        )}

        {/* ── empty state ── */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <BellOff className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-gray-500 text-sm text-center">
              {readFilter === "all" && categoryFilter === "all"
                ? "No notifications yet."
                : `No ${readFilter !== "all" ? readFilter + " " : ""}${
                    categoryFilter !== "all" ? categoryFilter + " " : ""
                  }notifications.`}
            </p>
          </div>
        )}

        {/* ── notification list ── */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2.5">
            {filtered.map((n) => {
              const meta = CATEGORY_META[n.category];
              return (
                <button
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={`w-full text-left group relative rounded-2xl border px-5 py-4 transition-all duration-200 hover:shadow-md ${
                    n.read
                      ? "bg-white border-gray-100 hover:border-gray-200"
                      : `${meta.bg} ${meta.border} shadow-sm`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* icon bubble */}
                    <div
                      className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center mt-0.5 ${
                        n.read ? "bg-gray-100 text-gray-400" : `${meta.iconBg} ${meta.iconColor}`
                      }`}
                    >
                      <NotificationIcon n={n} category={n.category} />
                    </div>

                    {/* content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-sm font-semibold leading-snug ${
                              n.read ? "text-gray-500" : "text-gray-900"
                            }`}
                          >
                            {n.title}
                          </p>
                          {/* Category pill — always visible */}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              n.category === "teacher"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-violet-100 text-violet-600"
                            }`}
                          >
                            {n.category === "teacher" ? "👨‍🏫 Teacher" : "🎓 Student"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {timeAgo(n.createdAt)}
                          </span>
                          {!n.read && (
                            <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dotColor}`} />
                          )}
                        </div>
                      </div>

                      <p
                        className={`text-sm leading-relaxed ${
                          n.read ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {n.message}
                      </p>

                      {/* meta badges */}
                      {(n.courseId || n.studentId) && (
                        <div className="flex gap-2 mt-2">
                          {n.courseId && (
                            <Badge
                              variant="outline"
                              className="rounded-full text-xs text-blue-700 border-blue-200"
                            >
                              Course #{n.courseId}
                            </Badge>
                          )}
                          {n.studentId && (
                            <Badge
                              variant="outline"
                              className="rounded-full text-xs text-violet-700 border-violet-200"
                            >
                              Student #{n.studentId}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* hover hint — only on unread */}
                  {!n.read && (
                    <span className="absolute right-4 bottom-3 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to mark read
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;