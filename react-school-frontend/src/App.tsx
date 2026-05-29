import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DecorativeBackground from "./components/DecorativeBackground";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DeshboardStudent from "./pages/DeshboardStudent";
import ProtectedRoute from "./components/ProtectedRoute";
import TeacherDashboard from "./pages/TeacherDashboard";
import CourseDetails from "./pages/CourseDetail";
import LessonDetail from "./pages/LessonDetail";
import QuizPage from "./pages/QuizPage";
import StudentBadges from "./pages/StudentBadges";
import StudentProfile from "./pages/StudentProfile";
import NotFound from "./pages/NotFound";
import Planner from "./pages/Planner";
import AdminLayout from "./components/admin/AdminLayout";
import AdminBadgesPage from "./pages/admin/AdminBadgesPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminStreamsPage from "./pages/admin/AdminStreamsPage";
import AdminSubjectsPage from "./pages/admin/AdminSubjectsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminCourseView from "./pages/admin/AdminCourseView";
import MyCourses from "@/pages/MyCourses";
import Progress from "@/pages/Progress";
import TeacherProfile from "@/pages/TeacherProfile";
import Notification from "./pages/Notification";
import TeachProfileForStudentPage from "./pages/TeachProfileForStudentPage";
import StudentNotificationsPage from "./pages/StudentNotifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
       <DecorativeBackground /> 
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student routes */}
          <Route
            path="/deshboardStudent"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <DeshboardStudent />
              </ProtectedRoute>
            }
          />
          <Route 
          path="/MyCourses"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <MyCourses />
            </ProtectedRoute>
          } />
          <Route
            path="/Progress"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Progress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Planner"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Planner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-notifications"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/badges"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentBadges />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers/:id"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <TeachProfileForStudentPage />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher-profile"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TeacherProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <Notification />
              </ProtectedRoute>
            }
          />

          {/* Shared authenticated routes */}
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/teachers/:id" element={<TeacherProfile />} />
          <Route path="/lesson/:id" element={<LessonDetail />} />
          <Route path="/quiz/:id" element={<QuizPage />} />

          {/* Admin routes — only ADMIN role can access */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="students" element={<AdminUsersPage filterRole="STUDENT" />} />
            <Route path="teachers" element={<AdminUsersPage filterRole="TEACHER" />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="courses/:id" element={<AdminCourseView />} />
            <Route path="badges" element={<AdminBadgesPage />} />
            <Route path="subjects" element={<AdminSubjectsPage />} />
            <Route path="streams" element={<AdminStreamsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
