import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, BookOpen, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getUser } from "@/services/authStorage";
import {
  getStudentBadgeTotal,
  getStudentStats,
  getStudentSummary,
  type StudentStats,
  type StudentSummary,
} from "@/services/studentDashboardService";
import { getStudyLevel } from "@/lib/studyLevels";
import StudentLayout from "@/components/StudentLayout";
import { getStudentBadgePage } from "@/services/badgeService";

const emptySummary: StudentSummary = {
  name: "Student",
  email: "",
  totalPoints: 0,
  totalBadges: 0,
  totalCompletedCourses: 0,
  totalEnrolledCourses: 0,
  totalActiveCourses: 0,
};

const emptyStats: StudentStats = {
  lessonsCompleted: 0,
  enrolledCourses: 0,
  points: 0,
};

const ProgressPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const studentId = Number(user?.userId ?? 0);

  const [summary, setSummary] = useState<StudentSummary>(emptySummary);
  const [stats, setStats] = useState<StudentStats>(emptyStats);
  const [badgeTotal, setBadgeTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!studentId) {
      navigate("/login");
      return;
    }

    const loadProgress = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [summaryData, statsData, badgeCount, badgePageData] = await Promise.all([
          getStudentSummary(studentId),
          getStudentStats(studentId),
          getStudentBadgeTotal(studentId),
          getStudentBadgePage(studentId).catch(() => ({ totalPoints: 0, badges: [] })),
        ]);

       const earnedBadgePoints = badgePageData.badges
          .filter((b) => b.earned)
          .reduce((sum, b) => sum + (b.bonusPoints ?? 0), 0);

        const coursePoints = summaryData.totalPoints || statsData.points || 0;
        const combinedTotal = coursePoints + earnedBadgePoints;

        setSummary({ ...summaryData, totalPoints: combinedTotal });
        setStats(statsData);
        setBadgeTotal(badgeCount || badgePageData.badges.filter(b => b.earned).length || summaryData.totalBadges);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load your progress.");
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [navigate, studentId]);

  const totalPoints = summary.totalPoints || stats.points;
  const levelInfo = getStudyLevel(totalPoints);
  const completedRatio =
    summary.totalEnrolledCourses > 0
      ? (summary.totalCompletedCourses / summary.totalEnrolledCourses) * 100
      : 0;

  const progressStats = [
    {
      title: "Courses Enrolled",
      value: summary.totalEnrolledCourses || stats.enrolledCourses,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Courses Completed",
      value: summary.totalCompletedCourses,
      icon: Trophy,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Active Courses",
      value: summary.totalActiveCourses,
      icon: TrendingUp,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Badges Earned",
      value: badgeTotal || summary.totalBadges,
      icon: Award,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  if (loading) {
    return (
      <StudentLayout activeItem="Progress">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </StudentLayout>
    );
  }

  if (errorMessage) {
    return (
      <StudentLayout activeItem="Progress">
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
    <StudentLayout activeItem="Progress">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Progress</h1>
          <p className="text-muted-foreground">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Level Card */}
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Level</p>
                <Badge
                  className="rounded-full px-4 py-2 font-bold text-lg"
                  style={{ backgroundColor: levelInfo.current.color, color: "white" }}
                >
                  {levelInfo.current.level}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-foreground">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">points earned</p>
              </div>
            </div>

            <Progress value={levelInfo.progress} className="h-4 rounded-full mb-3" />

            {levelInfo.next && (
              <p className="text-sm text-muted-foreground">
                {levelInfo.next.minPoints - totalPoints} points to reach{" "}
                <span className="font-semibold text-foreground">{levelInfo.next.level}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Course Completion */}
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Course Completion</h2>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-lg font-semibold text-foreground">
                  {summary.totalCompletedCourses}/{summary.totalEnrolledCourses}
                </span>
              </div>
              <Progress value={completedRatio} className="h-3 rounded-full" />
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(completedRatio)}% of courses completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {progressStats.map((stat) => (
            <Card key={stat.title} className="rounded-2xl shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Breakdown */}
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Learning Breakdown</h2>

            <div className="space-y-4">
              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Lessons Completed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.lessonsCompleted}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Continue learning to complete more lessons
                </p>
              </div>

              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Active Courses</p>
                  <p className="text-2xl font-bold text-foreground">{summary.totalActiveCourses}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Courses you're currently working on
                </p>
              </div>

              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(completedRatio)}%
                  </p>
                </div>
                <Progress value={completedRatio} className="h-2 rounded-full mb-2" />
                <p className="text-xs text-muted-foreground">
                  {summary.totalCompletedCourses} of {summary.totalEnrolledCourses} courses completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => navigate("/MyCourses")}
            className="rounded-2xl px-8 py-6 text-base"
          >
            View My Courses
          </Button>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ProgressPage;