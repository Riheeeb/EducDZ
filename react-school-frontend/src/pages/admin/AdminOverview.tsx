import { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { adminApi } from "@/services/adminApi";

interface PopularCourse {
  courseId:        number;
  title:           string;
  teacherName:     string;
  enrollmentCount: number;
}

interface ActiveStudent {
  studentId:        number;
  name:             string;
  lessonsCompleted: number;
  totalPoints:      number;
}

interface Stats {
  totalStudents:              number;
  totalTeachers:              number;
  totalCourses:               number;
  totalPublishedCourses:      number;
  totalLessons:               number;
  totalEnrollments:           number;
  totalCompletedEnrollments:  number;
  mostPopularCourses:         PopularCourse[];
  mostActiveStudents:         ActiveStudent[];
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getStats()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch(() => setError("Failed to load stats from server"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-destructive">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>

      {/* stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Students"             value={stats.totalStudents}            icon={GraduationCap} />
        <StatCard title="Teachers"             value={stats.totalTeachers}            icon={UserCheck} />
        <StatCard title="Total courses"        value={stats.totalCourses}             icon={BookOpen} />
        <StatCard
          title="Published courses"
          value={stats.totalPublishedCourses}
          icon={BookOpen}
          description="Visible to students"
        />
        <StatCard title="Total lessons"        value={stats.totalLessons}             icon={TrendingUp} />
        <StatCard title="Total enrollments"    value={stats.totalEnrollments}         icon={Users} />
        <StatCard
          title="Completed enrollments"
          value={stats.totalCompletedEnrollments}
          icon={CheckCircle}
          description="Courses finished by students"
        />
      </div>

      {/* top lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* most popular courses */}
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="font-semibold text-foreground mb-3">Most popular courses</h3>
          {stats.mostPopularCourses.length === 0 && (
            <p className="text-sm text-muted-foreground">No courses yet.</p>
          )}
          {stats.mostPopularCourses.map((c, i) => (
            <div key={c.courseId} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <span className="text-sm font-medium text-foreground">
                  {i + 1}. {c.title}
                </span>
                <p className="text-xs text-muted-foreground">{c.teacherName}</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {c.enrollmentCount} enrolled
              </span>
            </div>
          ))}
        </div>

        {/* most active students */}
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="font-semibold text-foreground mb-3">Most active students</h3>
          {stats.mostActiveStudents.length === 0 && (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          )}
          {stats.mostActiveStudents.map((s, i) => (
            <div key={s.studentId} className="flex justify-between items-center py-2 border-b last:border-0">
              <span className="text-sm font-medium text-foreground">
                {i + 1}. {s.name}
              </span>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{s.lessonsCompleted} lessons</p>
                <p className="text-xs text-muted-foreground">{s.totalPoints} pts</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminOverview;
