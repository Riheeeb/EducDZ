import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  GraduationCap,
  Home,
  LogOut,
  Video,
    ClipboardList,
  Menu,
  X,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUser } from "@/services/authStorage";
import { logoutUser } from "@/services/authService";

const sidebarItems = [
  { title: "Overview", icon: Home, path: "/teacher-dashboard" },
  { title: "Lessons", icon: Video , path: "/teacher-dashboard" },
  { title: "Courses", icon: BookOpen, path: "/teacher-dashboard" },
  { title: "Quizzes", icon: ClipboardList, path: "/teacher-dashboard" },
  { title: "Profile", icon: User, path: "/teacher-profile" },
];


interface TeacherLayoutProps {
  children: ReactNode;
  activeItem?: string;
}

const TeacherLayout = ({ children, activeItem = "Overview" }: TeacherLayoutProps) => {
  const navigate = useNavigate();
  const user = getUser();
  const displayName = user?.name ?? "Teacher";

  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        onClick={() => navigate("/teacher-dashboard")}
      />
      <span className="text-lg font-bold text-green-900 hidden sm:block">EducDZ</span>
    </div>
  </div>

  {/* CENTER */}
  <div className="flex items-center gap-2">
    <Avatar
      className="h-8 w-8 cursor-pointer"
      onClick={() => navigate("/teacher-profile")}
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
  <Button variant="ghost" size="icon" className="relative">
    <Bell className="h-10 w-10 text-green-700" />
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

export default TeacherLayout;
