import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getUser } from "@/services/authStorage";
import {
  getStudentProfileDetails,
  type StudentProfileDetails,
} from "@/services/studentProfileService";
import { getStudyLevel } from "@/lib/studyLevels";
import StudentLayout from "@/components/StudentLayout";
import { getStudentSummary, type StudentSummary, getStudentBadgeTotal, getStudentStats, type StudentStats } from "@/services/studentDashboardService";
import { getNextYearAfter, type Year } from "@/services/YearService";
import { getStudentBadgePage } from "@/services/badgeService";
const emptyProfile: StudentProfileDetails = {
  studentId: 0,
  name: "Student",
  email: "",
  currentYearLabel: "",
  studyLevelLabel: "",
  totalPoints: 0,
  totalEnrolledCourses: 0,
  totalCompletedCourses: 0,
  totalActiveCourses: 0,
  pointsToNext: 0,
  totalBadges: 0,
  studentLevel: "",
  streamId: null,
  substreamId: null,
  yearId: null,
  yearHistory: [],
};

const emptySummary: StudentSummary = {
  name: "Student",
  email: "",
  totalPoints: 0,
  totalBadges: 0,
  totalCompletedCourses: 0,
  totalEnrolledCourses: 0,
  totalActiveCourses: 0,
};

const StudentProfile = () => {
  const navigate = useNavigate();
  const user = getUser();
  const studentId = Number(user?.userId ?? 0);
  
  const [profile, setProfile] = useState<StudentProfileDetails>(emptyProfile);
  const [summary, setSummary] = useState<StudentSummary>(emptySummary);
  const [stats, setStats] = useState<StudentStats>({ lessonsCompleted: 0, enrolledCourses: 0, points: 0 });
  const [badgeTotal, setBadgeTotal] = useState(0);
  const [nextYear, setNextYear] = useState<Year | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      navigate("/login");
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileData, summaryData, badgeCount, statsData, badgePageData] = await Promise.all([
    getStudentProfileDetails(studentId),
    getStudentSummary(studentId),
    getStudentBadgeTotal(studentId),
    getStudentStats(studentId),
    getStudentBadgePage(studentId).catch(() => ({ totalPoints: 0, badges: [] })),
]);
        // Calculate badge points from earned badges
const earnedBadgePoints = badgePageData.badges
    .filter((b) => b.earned)
    .reduce((sum, b) => sum + (b.bonusPoints ?? 0), 0);

const coursePoints = summaryData.totalPoints || statsData.points || 0;
const combinedTotal = coursePoints + earnedBadgePoints;
        setProfile(profileData);
setSummary({ ...summaryData, totalPoints: combinedTotal });  // Use combined total
setStats(statsData);
setBadgeTotal(badgeCount || badgePageData.badges.filter(b => b.earned).length || summaryData.totalBadges);
        const currentYear =
          profileData.currentYearLabel ||
          profileData.yearHistory[profileData.yearHistory.length - 1]?.yearLabel;
        setNextYear(currentYear ? await getNextYearAfter(currentYear) : null);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, studentId]);

  // Use the correct name priority: user.name > summary.name > profile.name > fallback
  const studentName = 
    user?.name?.trim() || 
    (summary.name && summary.name !== "Student" ? summary.name : "") ||
    (profile.name && profile.name !== "Student" ? profile.name : "") ||
    "Student";

  
const totalPoints = summary.totalPoints || 0;
  const levelInfo = getStudyLevel(totalPoints);
  const totalLessons = profile.yearHistory.reduce(
    (sum, year) => sum + (year.lessonsCompleted ?? 0),
    0
  );

  const globalStats = [
    { label: "Lessons", value: totalLessons, icon: BookOpen },
    { label: "Enrolled", value: profile.totalEnrolledCourses, icon: TrendingUp },
    { label: "Completed", value: profile.totalCompletedCourses, icon: Trophy },
    { label: "Points", value: totalPoints, icon: Star },
    { label: "Badges", value: badgeTotal || profile.totalBadges, icon: Award },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading profile...</div>;
  }

  // Get current year's stream and substream (from the latest year in history)
  const currentYearData = profile.yearHistory?.[profile.yearHistory.length - 1];

  return (
    <StudentLayout activeItem="Profile">
      <Card className="rounded-2xl shadow-md mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {studentName?.charAt(0).toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1">
                <h1 className="text-2xl font-bold text-foreground">{studentName}</h1>
                <div className="space-y-1.5 text-sm mt-3">
                  {(profile.email || summary.email || user?.email) && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Email:</span> {profile.email || summary.email || user?.email}
                    </p>
                  )}
                  {(profile.currentYearLabel || currentYearData?.yearLabel) && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Year:</span> {profile.currentYearLabel || currentYearData?.yearLabel}
                    </p>
                  )}
                  {currentYearData?.stream && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Stream:</span> {currentYearData.stream}
                    </p>
                  )}
                  {currentYearData?.substream && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Substream:</span> {currentYearData.substream}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center shrink-0 sm:border-l sm:border-border sm:pl-6">
              <div className="flex items-center gap-2 mb-2 justify-center">
                <Sparkles className="h-5 w-5" style={{ color: levelInfo.current.color }} />
                <Badge
                  className="rounded-full px-3 py-1 font-bold"
                  style={{ backgroundColor: levelInfo.current.color, color: "white" }}
                >
                  {levelInfo.current.level}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-foreground">{totalPoints} pts</p>
              <p className="text-xs text-muted-foreground mb-3">Points earned</p>
              {levelInfo.next && (
                <Tooltip>
                  <TooltipTrigger>
                    <p className="text-xs text-primary cursor-help">
                      {levelInfo.next.minPoints - totalPoints} pts to {levelInfo.next.level}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Keep earning points to level up.</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Progress value={levelInfo.progress} className="h-2 rounded-full mt-3 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {globalStats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-4">Academic History</h2>
      <div className="space-y-6">
        {profile.yearHistory.length > 0 ? (
          <>
            {[profile.yearHistory[profile.yearHistory.length - 1]].filter(Boolean).map((year) => {
          const effectiveCurrentYear = profile.currentYearLabel || profile.yearHistory[profile.yearHistory.length - 1]?.yearLabel;
          const isCurrent = year.yearLabel === effectiveCurrentYear;

          return (
            <Card
              key={`${year.yearLabel}-${year.academicPeriod}`}
              className={`rounded-2xl shadow-md ${isCurrent ? "border-2 border-primary" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{year.yearLabel}</h3>
                    </div>
                    {isCurrent && (
                      <Badge className="rounded-full bg-primary text-primary-foreground">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {year.stream && <Badge variant="outline" className="rounded-full">{year.stream}</Badge>}
                    {year.substream && (
                      <Badge variant="secondary" className="rounded-full">
                        {year.substream}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                  <div className="bg-secondary rounded-2xl p-3 text-center">
                    <p className="text-sm font-bold text-foreground">{year.totalEnrolledCourses}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                  <div className="bg-secondary rounded-2xl p-3 text-center">
                    <p className="text-sm font-bold text-foreground">{year.lessonsCompleted ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Lessons</p>
                  </div>
                  <div className="bg-secondary rounded-2xl p-3 text-center">
                    <p className="text-sm font-bold text-foreground">{summary.totalCompletedCourses}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="bg-secondary rounded-2xl p-3 text-center">
                    <p className="text-sm font-bold text-foreground">{totalPoints}</p>
                    <p className="text-xs text-muted-foreground">Points</p>
                  </div>
                  <div className="bg-secondary rounded-2xl p-3 text-center">
                    <p className="text-sm font-bold text-foreground">{year.badgesEarned}</p>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                </div>

                {year.courses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Courses</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {year.courses.map((course) => (
                        <Card
                          key={course.courseId}
                          className="rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/course/${course.courseId}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2 gap-3">
                              <h4 className="font-medium text-foreground text-sm">{course.courseTitle}</h4>
                              <Badge variant="secondary" className="rounded-full text-xs">
                                {course.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">By {course.teacherName}</p>
                            <Progress value={course.progressPercent} className="h-1.5 rounded-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
            })}
            
            {nextYear ? (
                <Card className="rounded-2xl shadow-md bg-gray-300 border border-gray-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-600">{nextYear.year}</h3>
                          <p className="text-sm text-gray-500">Next Academic Year</p>
                        </div>
                        <Badge className="rounded-full bg-yellow-400 text-yellow-900 font-semibold">
                          Locked
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Come back next academic year to continue your learning journey</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ) : null}
          </>
        ) : (
          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No academic history available yet. Start enrolling in courses!</p>
            </CardContent>
          </Card>
        )}
      </div>

      
    </StudentLayout>
  );
};

export default StudentProfile;
