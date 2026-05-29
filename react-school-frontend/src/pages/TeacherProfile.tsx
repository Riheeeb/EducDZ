import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, ClipboardList, Mail } from "lucide-react";
import StudentLayout from "@/components/StudentLayout";
import TeacherLayout from "@/components/TeacherLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTeacherProfile, type TeacherProfile as TeacherProfileData } from "@/services/teacherService";
import { getUser } from "@/services/authStorage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


const TeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const ownProfile = !id;

  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const teacherId = Number(id ?? user?.userId ?? 0);
    if (!teacherId) {
      setLoading(false);
      return;
    }

    getTeacherProfile(teacherId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [id, user?.userId]);

  const Layout = ownProfile ? TeacherLayout : StudentLayout;

  
  const layoutProps = { activeItem: "Profile" };

  
  const handleCoursesClick = () => {
    if (ownProfile) {
      navigate("/teacher-dashboard?tab=Courses");
    } else {
      navigate(`/courses?teacherId=${id}`);
    }
  };

  const handleLessonsClick = () => {
    if (ownProfile) {
      navigate("/teacher-dashboard?tab=Lessons");
    } else {
      navigate(`/lessons?teacherId=${id}`);
    }
  };

  if (loading) {
    return (
      <Layout {...layoutProps}>
        <p className="text-muted-foreground">Loading teacher...</p>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout {...layoutProps}>
        <p className="text-muted-foreground">Teacher not found.</p>
      </Layout>
    );
  }

  return (
    <Layout {...layoutProps}>
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
                <h1 className="text-3xl font-bold text-foreground">
                  {profile.name}
                </h1>

                {/* 👇 subject + email مفصولين */}
                <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                  
                  {profile.subject && (
                    <Badge className="rounded-full w-fit">
                      {profile.subject}
                    </Badge>
                  )}

                  {profile.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </span>
                  )}

                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 👇 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <Card
          className="rounded-2xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-primary/5"
          onClick={handleCoursesClick}
        >
          <CardContent className="p-5 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              {profile.totalCourses} courses
            </span>
          </CardContent>
        </Card>

        <Card
          className="rounded-2xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-primary/5"
          onClick={handleLessonsClick}
        >
          <CardContent className="p-5 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              {profile.totalLessons} lessons
            </span>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default TeacherProfile;