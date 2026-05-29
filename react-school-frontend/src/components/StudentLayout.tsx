import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUser } from "@/services/authStorage";
import { logoutUser } from "@/services/authService";
import { getTotalStudentUnreadNotificationCount } from "@/lib/studentNotificationBadge";
import { sweepStudentPlannerReminders } from "@/lib/studentPlannerNotifications";
import AppBackground from "@/components/AppBackground";

const sidebarItems = [
  { title: "Home", icon: Home, path: "/deshboardStudent" },
  { title: "My Courses", icon: BookOpen, path: "/MyCourses" },
  { title: "Progress", icon: TrendingUp, path: "/Progress" },
  { title: "Planner", icon: CalendarDays, path: "/Planner" },
  { title: "Badges", icon: Award, path: "/badges" },
  { title: "Profile", icon: User, path: "/profile" },
];

interface StudentLayoutProps {
  children: ReactNode;
  activeItem?: string;
}

const StudentLayout = ({ children, activeItem = "Home" }: StudentLayoutProps) => {
  const navigate = useNavigate();
  const user = getUser();
  const studentId = Number(user?.userId ?? 0);
  const displayName = user?.name ?? "Student";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationUnread, setNotificationUnread] = useState(0);

  useEffect(() => {
    if (!studentId) return undefined;

    const refreshBadge = () => {
      void getTotalStudentUnreadNotificationCount(studentId).then(setNotificationUnread);
    };
    const onEvt = () => refreshBadge();

    void sweepStudentPlannerReminders(studentId).finally(refreshBadge);
    const interval = window.setInterval(() => {
      void sweepStudentPlannerReminders(studentId).finally(refreshBadge);
    }, 65_000);
    const apiPoll = window.setInterval(refreshBadge, 75_000);
    window.addEventListener("student-notifications-changed", onEvt);
    refreshBadge();

    return () => {
      window.clearInterval(interval);
      window.clearInterval(apiPoll);
      window.removeEventListener("student-notifications-changed", onEvt);
    };
  }, [studentId]);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const handleSidebarClick = (item: typeof sidebarItems[0]) => {
    navigate(item.path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">

      {/* HEADER */}
 <header className="fixed inset-x-0 top-0 h-16 border-b border-gray-200 bg-transparent backdrop-blur-md shadow-sm flex items-center justify-between px-4 md:px-6 z-30">

  {/* LEFT */}
  <div className="flex items-center gap-4">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="md:hidden"
    >
      {sidebarOpen ? (
        <X className="h-5 w-5 text-black" />
      ) : (
        <Menu className="h-5 w-5 text-black" />
      )}
    </Button>

    <div className="flex items-center gap-2">
      <GraduationCap
        className="h-10 w-10 bg-green-200 text-green-600 rounded-full p-1 cursor-pointer"
        onClick={() => navigate("/deshboardStudent")}
      />
      <span className="text-lg font-bold text-green-900 hidden sm:block">EducDZ</span>
    </div>
  </div>

  {/* CENTER */}
  <div className="flex items-center gap-2">
    <Avatar
      className="h-8 w-8 cursor-pointer"
      onClick={() => navigate("/profile")}
    >
      <AvatarImage src="" />
      <AvatarFallback className="bg-green-300 text-green-600 text-l">
        {displayName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>

    <span className="text-sm text-black hidden sm:block">
      Welcome, <span className="font-semibold">{displayName}</span>
    </span>
  </div>

  {/* RIGHT */}
  <Button
    variant="ghost"
    size="icon"
    className="relative"
    aria-label="Notifications"
    title="Notifications"
    onClick={() => navigate("/student-notifications")}
  >
    <Bell className="h-10 w-10 text-green-700" />
    {notificationUnread > 0 && (
      <span className="absolute top-0 right-0 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-[10px] leading-[1.1rem] text-white text-center">
        {notificationUnread > 9 ? "9+" : notificationUnread}
      </span>
    )}
  </Button>

</header>

      {/* SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden pt-16">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed top-16 bottom-0 left-0 z-20 w-56 
          bg-white/70 backdrop-blur-md 
          border-r border-gray-200 shadow-sm
          transition-transform duration-200 ease-in-out flex flex-col`}
        >
          <nav className="p-3 space-y-2 mt-4 flex-1">
            {sidebarItems.map((item) => {
              const isActive = activeItem === item.title;

              return (
                <button
                  key={item.title}
                  onClick={() => handleSidebarClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-green-300 text-green-900 shadow"
                      : "text-gray-700 hover:bg-green-400 hover:text-green-200"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${
                      isActive ? "text-green-900" : "text-gray-500 group-hover:text-green-700"
                    }`}
                  />
                  {item.title}
                </button>
              );
            })}
          </nav>

          <div className="p-3 mb-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium 
              text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-foreground/20 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6 md:p-8 overflow-auto md:ml-56">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
