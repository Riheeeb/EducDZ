import { Outlet, useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  Award,
  Layers,
  Tag,
  Shield,
} from "lucide-react";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "All Users", url: "/admin/users", icon: Users },
  { title: "Students", url: "/admin/students", icon: GraduationCap },
  { title: "Teachers", url: "/admin/teachers", icon: UserCheck },
  { title: "Courses", url: "/admin/courses", icon: BookOpen },
  { title: "Badges", url: "/admin/badges", icon: Award },
  { title: "Subjects", url: "/admin/subjects", icon: Tag },
  { title: "Streams", url: "/admin/streams", icon: Layers },
];

const AdminLayout = () => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-teal-50 relative overflow-hidden">
        <Sidebar collapsible="icon" className="pt-14 bg-white border-r border-teal-100 shadow-sm">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Admin Panel</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/admin"}
                          className="hover:bg-muted/50"
                          activeClassName="bg-primary/10 text-primary font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="fixed inset-x-0 top-0 h-14 flex items-center border-b border-teal-100 px-4 gap-4 bg-white z-30">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
            <div className="ml-auto">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to App
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 pt-20">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
