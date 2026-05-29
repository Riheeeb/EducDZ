import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, ClipboardList, Mail, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import StudentLayout from "@/components/StudentLayout";
import TeacherLayout from "@/components/TeacherLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTeacherProfile, type TeacherProfile as TeacherProfileData } from "@/services/teacherService";
import { 
  getTeacherPublicCourses, 
  getTeacherLessons, 
  type TeacherPublicCoursesResponse,
  type TeacherLesson,
  type TeacherCourse,
} from "@/services/teacherDashboardService";
import { getUser } from "@/services/authStorage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ViewMode = "none" | "courses" | "lessons";

const TeachProfileForStudentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const ownProfile = !id;
  
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState<ViewMode>("none");
  
  // Courses pagination state
  const [coursesData, setCoursesData] = useState<TeacherPublicCoursesResponse | null>(null);
  const [coursesPage, setCoursesPage] = useState(0);
  const [coursesLoading, setCoursesLoading] = useState(false);
  
  // Lessons state
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  const teacherId = Number(id ?? user?.userId ?? 0);

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    getTeacherProfile(teacherId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [id, user?.userId]);

  const loadCourses = async (page: number = 0) => {
    if (!teacherId) return;
    setCoursesLoading(true);
    try {
      const data = await getTeacherPublicCourses(teacherId, page, 5);
      setCoursesData(data);
      setCoursesPage(page);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadLessons = async () => {
    if (!teacherId) return;
    setLessonsLoading(true);
    try {
      // Need courses for fallback in getTeacherLessons
      const coursesForFallback = coursesData?.content ?? [];
      const data = await getTeacherLessons(teacherId, coursesForFallback);
      setLessons(data);
    } catch (err) {
      console.error("Failed to load lessons:", err);
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleCardClick = (view: ViewMode) => {
    // Toggle off if clicking same view
    if (activeView === view) {
      setActiveView("none");
      return;
    }

    setActiveView(view);

    // Load data if not already loaded
    if (view === "courses" && !coursesData) {
      loadCourses(0);
    } else if (view === "lessons" && lessons.length === 0) {
      loadLessons();
    }
  };

  const handleCoursesPageChange = (newPage: number) => {
    if (newPage < 0 || (coursesData && newPage >= coursesData.totalPages)) return;
    loadCourses(newPage);
  };

  const Layout = ownProfile ? TeacherLayout : StudentLayout;
  const layoutProps = ownProfile ? { activeItem: "Profile" } : { activeItem: "Courses" };

  if (loading) {
    return (
      <Layout {...layoutProps}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout {...layoutProps}>
        <p className="text-muted-foreground text-center py-12">Teacher not found.</p>
      </Layout>
    );
  }

  return (
    <Layout activeItem="Profile" {...layoutProps}>
      {/* Profile Card */}
      <Card className="rounded-2xl shadow-md mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarFallback className="bg-green-300 text-green-900 text-4xl font-bold">
                  {profile.name.charAt(0).toUpperCase() || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1">
                <h1 className="text-3xl font-bold text-foreground">{profile.name}</h1>
                <div className="mt-2 flex flex-col items-left gap-3 text-l text-muted-foreground">
                  {profile.subject && <Badge className="rounded-full w-fit">{profile.subject}</Badge>}
                  {profile.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-4 w-4" /> {profile.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={`rounded-2xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md ${
            activeView === "courses" ? "ring-2 ring-primary bg-primary/5" : ""
          }`}
          onClick={() => handleCardClick("courses")}
        >
          <CardContent className="p-5 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">{profile.totalPublishedCourses} courses</span>
          </CardContent>
        </Card>

        <Card
          className={`rounded-2xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md ${
            activeView === "lessons" ? "ring-2 ring-primary bg-primary/5" : ""
          }`}
          onClick={() => handleCardClick("lessons")}
        >
          <CardContent className="p-5 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="font-semibold">{profile.totalLessons} lessons</span>
          </CardContent>
        </Card>
      </div>

      {/* Courses Content */}
      {activeView === "courses" && (
        <Card className="rounded-2xl shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              All Courses
            </h2>

            {coursesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !coursesData || coursesData.content.length === 0 ? (
              <p className="text-muted-foreground">No courses available.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {coursesData.content.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {course.description || "No description"}
                          </p>
                        </div>
                        <Badge variant="default" className="shrink-0 ml-3">
                          Published
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{course.year}</span>
                        <span>{course.stream}</span>
                        <span>{course.lessonsCount} lessons</span>
                        <span>{course.enrolledCount} enrolled</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {coursesData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCoursesPageChange(coursesPage - 1)}
                      disabled={coursesData.first || coursesLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      Page {coursesPage + 1} of {coursesData.totalPages}
                      <span className="ml-2">({coursesData.totalElements} total)</span>
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCoursesPageChange(coursesPage + 1)}
                      disabled={coursesData.last || coursesLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lessons Content */}
      {activeView === "lessons" && (
        <Card className="rounded-2xl shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              All Lessons
            </h2>

            {lessonsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-muted-foreground">No lessons available.</p>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/lessons/${lesson.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {lesson.description || "No description"}
                        </p>
                      </div>
                      <Badge
                        variant={lesson.type === "video" ? "default" : "secondary"}
                        className="shrink-0 ml-3"
                      >
                        {lesson.type === "video" ? "Video" : "PDF"}
                      </Badge>
                    </div>
                    {lesson.courseTitle && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Course: {lesson.courseTitle}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default TeachProfileForStudentPage;