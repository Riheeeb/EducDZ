import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  Clock,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StudentLayout from "@/components/StudentLayout";
import { getUser } from "@/services/authStorage";
import api from "@/services/api";
import {
  loadStudentNotifications,
  markAllStudentNotificationsRead,
  type StoredStudentNotification,
} from "@/lib/studentPlannerNotifications";

// ── types ──────────────────────────────────────────────────────────────────

type Source = "server" | "planner";
type NotifCategory = "session" | "badge" | "general";
type ReadFilter = "all" | "unread" | "read";
type CategoryFilter = "all" | "session" | "badge";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  source: Source;
  category: NotifCategory;
  read: boolean;
};

// ── helpers ────────────────────────────────────────────────────────────────

function toIso(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

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

const classifyNotification = (title: string, message: string, source: Source): NotifCategory => {
  const t = title.toLowerCase();
  const m = message.toLowerCase();
  if (source === "planner" || t.includes("session") || t.includes("reminder") || t.includes("start") || m.includes("10 min") || m.includes("starting soon"))
    return "session";
  if (t.includes("badge") || m.includes("badge") || t.includes("achievement") || m.includes("earned"))
    return "badge";

  return "general";
};

// ── category visual config ─────────────────────────────────────────────────

const CATEGORY_META: Record<
  NotifCategory,
  { label: string; emoji: string; pillBg: string; pillText: string; iconBg: string; iconColor: string; cardBg: string; cardBorder: string; dotColor: string }
> = {
  session: {
    label: "Session",
    emoji: "⏰",
    pillBg: "bg-amber-100",
    pillText: "text-amber-700",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    cardBg: "bg-amber-50",
    cardBorder: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  badge: {
    label: "Badge",
    emoji: "🏅",
    pillBg: "bg-violet-100",
    pillText: "text-violet-700",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    cardBg: "bg-violet-50",
    cardBorder: "border-violet-200",
    dotColor: "bg-violet-500",
  },
  general: {
    label: "General",
    emoji: "🔔",
    pillBg: "bg-green-100",
    pillText: "text-green-700",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    cardBg: "bg-green-50",
    cardBorder: "border-green-200",
    dotColor: "bg-green-500",
  },
};

const NotificationIcon = ({ category }: { category: NotifCategory }) => {
  switch (category) {
    case "session": return <Clock className="h-4 w-4" />;
    case "badge":   return <Award className="h-4 w-4" />;
    default:        return <Bell className="h-4 w-4" />;
  }
};

// ── localStorage read-state persistence ────────────────────────────────────

const storageKey = (studentId: number) => `student_notif_read_ids_${studentId}`;

const loadReadIds = (studentId: number): Set<string> => {
  try {
    const raw = localStorage.getItem(storageKey(studentId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const saveReadIds = (studentId: number, ids: Set<string>) => {
  try {
    localStorage.setItem(storageKey(studentId), JSON.stringify([...ids]));
  } catch {}
};



const StudentNotifications = () => {
  const navigate = useNavigate();
  const user = getUser();
  const studentId = Number(user?.userId ?? 0);

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    if (!studentId) { navigate("/login"); return; }

    let cancelled = false;

    void (async () => {
      const planner = loadStudentNotifications(studentId);
      const readIds = loadReadIds(studentId);

      let serverList: Array<{ id?: number; title?: string; message?: string; createdAt?: string; read?: boolean }> = [];
      try {
        const { data } = await api.get(`/students/${studentId}/notifications`);
        serverList = Array.isArray(data) ? data : [];
      } catch {
        serverList = [];
      }

      if (cancelled) return;

      const merged: NotificationRow[] = [
        ...serverList.map((n) => {
          const id = `srv-${n.id ?? 0}`;
          const title = n.title ?? "Notification";
          const message = n.message ?? "";
          const category = classifyNotification(title, message, "server");
          return {
            id,
            title,
            message,
            createdAt: toIso(n.createdAt),
            source: "server" as const,
            category,
            read: n.read === true || readIds.has(id),
          };
        }),
        ...planner.map((n: StoredStudentNotification) => {
          const category = classifyNotification(n.title, n.message, "planner");
          return {
            id: n.id,
            title: n.title,
            message: n.message,
            createdAt: n.createdAt,
            source: "planner" as const,
            category,
            read: readIds.has(n.id),
          };
        }),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setItems(merged);
      setLoading(false);

      // Mark all as read on server/planner silently
      try { await api.post(`/students/${studentId}/notifications/read-all`); } catch {}
      markAllStudentNotificationsRead(studentId);
      window.dispatchEvent(new CustomEvent("student-notifications-changed"));
    })();

    return () => { cancelled = true; };
  }, [navigate, studentId]);

  // Persist read state whenever items change
  useEffect(() => {
    if (!studentId || items.length === 0) return;
    const readIds = new Set(items.filter((n) => n.read).map((n) => n.id));
    saveReadIds(studentId, readIds);
  }, [items, studentId]);

  const markOne = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const goForRow = (row: NotificationRow) => {
    markOne(row.id);
    if (row.source === "planner") navigate("/Planner");
    else if (row.category === "badge") navigate("/badges");
    else navigate("/DeshboardStudent");
  };

  const filtered = useMemo(
    () =>
      items.filter((n) => {
        const matchRead = readFilter === "all" || (readFilter === "unread" ? !n.read : n.read);
        const matchCat = categoryFilter === "all" || n.category === categoryFilter;
        return matchRead && matchCat;
      }),
    [items, readFilter, categoryFilter]
  );

  const unreadCount  = items.filter((n) => !n.read).length;
  const sessionUnread = items.filter((n) => !n.read && n.category === "session").length;
  const badgeUnread   = items.filter((n) => !n.read && n.category === "badge").length;

  return (
    <StudentLayout activeItem="Home">
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* ── page title + mark all ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" />
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
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

        <p className="text-sm text-muted-foreground -mt-4">
          Session reminders from the Planner and badge awards appear here.
        </p>

        {/* ── summary cards ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Session */}
          <div className="rounded-2xl border border-amber-100 bg-white px-3 py-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <CalendarClock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium leading-tight">Session Reminders</p>
            </div>
            {sessionUnread > 0 ? (
              <Badge className="rounded-full bg-amber-500 text-white text-xs px-2 w-fit">
                {sessionUnread} unread
              </Badge>
            ) : (
              <span className="text-xs text-gray-400">All caught up</span>
            )}
          </div>

          {/* Badge */}
          <div className="rounded-2xl border border-violet-100 bg-white px-3 py-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <Award className="h-4 w-4 text-violet-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium leading-tight">Badges Earned</p>
            </div>
            {badgeUnread > 0 ? (
              <Badge className="rounded-full bg-violet-500 text-white text-xs px-2 w-fit">
                {badgeUnread} unread
              </Badge>
            ) : (
              <span className="text-xs text-gray-400">All caught up</span>
            )}
          </div>

        </div>

        {/* ── filters row ── */}
        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          <div className="flex gap-1.5 bg-white border border-gray-100 rounded-full px-1.5 py-1 shadow-sm">
            {(["all", "session", "badge"] as CategoryFilter[]).map((cat) => {
              const active = categoryFilter === cat;
              const activeColor =
                cat === "session" ? "bg-amber-500 text-white" :
                cat === "badge"   ? "bg-violet-500 text-white" :
                                    "bg-green-600 text-white";
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                    active ? activeColor : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {cat === "all"     ? "All types" :
                   cat === "session" ? "⏰ Session" :
                                       "🏅 Badge"}
                </button>
              );
            })}
          </div>

          {/* Read-state filter */}
          <div className="flex gap-1.5 bg-white border border-gray-100 rounded-full px-1.5 py-1 shadow-sm">
            {(["all", "unread", "read"] as ReadFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setReadFilter(tab)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  readFilter === tab ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-800"
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
                ? "Nothing here yet — complete lessons to earn badges, or add sessions in the Planner."
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
                  type="button"
                  onClick={() => goForRow(n)}
                  className={`w-full text-left group relative rounded-2xl border px-5 py-4 transition-all duration-200 hover:shadow-md ${
                    n.read
                      ? "bg-white border-gray-100 hover:border-gray-200"
                      : `${meta.cardBg} ${meta.cardBorder} shadow-sm`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* icon bubble */}
                    <div
                      className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center mt-0.5 ${
                        n.read ? "bg-gray-100 text-gray-400" : `${meta.iconBg} ${meta.iconColor}`
                      }`}
                    >
                      <NotificationIcon category={n.category} />
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
                          {/* Category pill */}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.pillBg} ${meta.pillText}`}
                          >
                            {meta.emoji} {meta.label}
                          </span>
                          {/* Source pill */}
                          {n.source === "planner" && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              Planner
                            </span>
                          )}
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

                      <p className="text-xs text-gray-300 mt-1.5">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
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
      </div>
    </StudentLayout>
  );
};

export default StudentNotifications;