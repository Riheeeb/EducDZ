import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getUser } from "@/services/authStorage";
import {
  getCourses,
  type Course,
} from "@/services/CourseService";
import {
  getStudentEnrollments,
  type StudentEnrollment,
} from "@/services/studentDashboardService";
import StudentLayout from "@/components/StudentLayout";

const MyCourses = () => {
  const navigate = useNavigate();
  const user = getUser();
  const studentId = Number(user?.userId ?? 0);

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!studentId) {
      navigate("/login");
      return;
    }

    const loadCourses = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [courseData, enrollmentData] = await Promise.all([
          getCourses(0, 50),
          getStudentEnrollments(studentId),
        ]);

        setCourses(courseData);
        setEnrollments(enrollmentData);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load your courses.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [navigate, studentId]);

  const enrolledCourses = useMemo(() => {
    const map = new Map(courses.map((course) => [course.id, course]));

    return enrollments.map((enrollment) => ({
      ...enrollment,
      course: map.get(enrollment.courseId),
    }));
  }, [courses, enrollments]);

  if (loading) {
    return (
      <StudentLayout activeItem="My Courses">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading your courses...</p>
        </div>
      </StudentLayout>
    );
  }

  if (errorMessage) {
    return (
      <StudentLayout activeItem="My Courses">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-8 text-center">
            <p className="text-foreground font-medium mb-4">{errorMessage}</p>
            <Button onClick={() => window.location.reload()} className="rounded-2xl">
              Retry
            </Button>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activeItem="My Courses">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Courses</h1>
          <p className="text-muted-foreground">
            You are enrolled in {enrolledCourses.length} course{enrolledCourses.length !== 1 ? "s" : ""}
          </p>
        </div>

        {enrolledCourses.length === 0 ? (
          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">You are not enrolled in any courses yet.</p>
              <Button 
                onClick={() => navigate("/DeshboardStudent")}
                className="rounded-2xl"
              >
                Explore Courses
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((item) => (
              <Card 
                key={item.id} 
                className="rounded-2xl shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <h3 className="font-semibold text-foreground text-lg">
                      {item.course?.title ?? item.courseTitle}
                    </h3>
                    <Badge
                      variant={
                        item.status === "completed"
                          ? "default"
                          : item.status === "dropped"
                            ? "destructive"
                            : "secondary"
                      }
                      className="rounded-full text-xs capitalize shrink-0"
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {item.course?.description ?? item.courseDescription}
                  </p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2 rounded-full" />
                  </div>

                  {item.course?.teacherName && (
                    <p className="text-xs text-muted-foreground mb-3">
                      By {item.course.teacherName}
                    </p>
                  )}

                  <div className="flex gap-2 mb-4 flex-wrap">
                    {item.course?.subject && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {item.course.subject}
                      </Badge>
                    )}
                    {item.course?.stream && (
                      <Badge variant="outline" className="rounded-full text-xs">
                        {item.course.stream}
                      </Badge>
                    )}
                    {item.course?.year && (
                      <Badge variant="outline" className="rounded-full text-xs">
                        {item.course.year}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                    <span>{item.course?.lessonsCount ?? 0} Lessons</span>
                    <span>{item.course?.quizzesCount ?? 0} Quizzes</span>
                  </div>

                  <Button
                    size="sm"
                    className="rounded-2xl gap-2 w-full"
                    onClick={() => navigate(`/course/${item.courseId}`)}
                  >
                    <Play className="h-4 w-4" />
                    {item.status === "completed" ? "Review" : "Continue"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default MyCourses;



