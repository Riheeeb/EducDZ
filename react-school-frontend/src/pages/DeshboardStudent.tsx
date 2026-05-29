import { useCallback, useEffect, useRef, useMemo, useState } from "react";
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
  Play,
  Search,
  Star,
  TrendingUp,
  Trophy,
  User,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getUser } from "@/services/authStorage";
import { logoutUser } from "@/services/authService";
import {
  discoverCourses,
  getCourses,
  getLatestCourses,
  getRecommendedCourses,
  type Course,
} from "@/services/CourseService";
import { getQuizzesByCourse, type QuizSummary } from "@/services/quizService";
import {
  getContinueLearningLesson,
  getStudentBadgeTotal,
  getStudentEnrollments,
  getStudentStats,
  getStudentSummary,
  searchLearningContent,
  type ContinueLearningLesson,
  type StudentEnrollment,
  type StudentStats,
  type StudentSummary,
} from "@/services/studentDashboardService";
import { getStudentProfileDetails } from "@/services/studentProfileService";
import { getStudyLevel } from "@/lib/studyLevels";
import AppBackground from "@/components/AppBackground";
import DecorativeBackground from "@/components/DecorativeBackground";
import { getAllYears, getStreamsByYear } from "@/services/YearService";
import api from "@/services/api";
import { getTotalStudentUnreadNotificationCount } from "@/lib/studentNotificationBadge";
import { sweepStudentPlannerReminders } from "@/lib/studentPlannerNotifications";
import { getStudentBadgePage } from "@/services/badgeService";
import { ChevronLeft, ChevronRight } from "lucide-react";

const sidebarItems = [
  { title: "Home", icon: Home },
  { title: "My Courses", icon: BookOpen },
  { title: "Progress", icon: TrendingUp },
  { title: "Planner", icon: CalendarDays },
  { title: "Badges", icon: Award },
  { title: "Profile", icon: User },
];

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

const DeshboardStudent = () => {
  const navigate = useNavigate();
  const user = getUser();
  const studentId = Number(user?.userId ?? 0);
  const userName = user?.name ?? "Student";

  const [activeItem, setActiveItem] = useState("Home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [summary, setSummary] = useState<StudentSummary>(emptySummary);
  const [stats, setStats] = useState<StudentStats>(emptyStats);
  const [badgeTotal, setBadgeTotal] = useState(0);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [latestCourses, setLatestCourses] = useState<Course[]>([]);
  const [browseCourses, setBrowseCourses] = useState<Course[]>([]);
  const [filterStreamId, setFilterStreamId] = useState<number | null>(null);
  const [filterSubjectId, setFilterSubjectId] = useState<number | null>(null);
  const [filterYearId, setFilterYearId] = useState<number | null>(null);
  const [streamOptions, setStreamOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [subjectOptions, setSubjectOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [yearOptions, setYearOptions] = useState<Array<{ id: number; label: string; yearCode?: string }>>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [dashNotificationUnread, setDashNotificationUnread] = useState(0);
  const [continueLesson, setContinueLesson] = useState<ContinueLearningLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    teachers: Array<{
      id: number;
      name: string;
      courseCount: number;
    }>;
    courses: Array<
      Pick<
        Course,
        "id" | "title" | "description" | "teacherName" | "subject" | "stream" | "year" | "substream" | "lessonsCount" | "quizzesCount"
      >
    >;
    lessons: Array<{
      id: number;
      title: string;
      description: string;
      courseId: number | null;
      courseTitle: string;
    }>;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [courseQuizzes, setCourseQuizzes] = useState<Record<number, QuizSummary[]>>({});
  const [studentYearId, setStudentYearId] = useState<number | null>(null);

  const activeYearId = filterYearId ?? studentYearId;
  const isMiddleSchool = useMemo(() => {
    if (activeYearId == null) return false;
    const opt = yearOptions.find((o) => o.id === activeYearId);
    return opt?.yearCode?.toUpperCase().includes("AM") ?? false;
  }, [activeYearId, yearOptions]);

  const displayName =
    user?.name?.trim() || (summary.name && summary.name !== "Student" ? summary.name : "Student");

     const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const slideNext = () => {
    setCurrentSlide((prev) => (prev + 1) % latestCourses.length);
  };

  const slidePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + latestCourses.length) % latestCourses.length);
  };

  const [browseCurrentSlide, setBrowseCurrentSlide] = useState(0);
const browseSliderRef = useRef<HTMLDivElement>(null);

const browseSlideNext = () => {
    if (browseCourses.length <= 3) return;
    setBrowseCurrentSlide((prev) => Math.min(prev + 1, Math.ceil(browseCourses.length / 3) - 1));
};

const browseSlidePrev = () => {
    setBrowseCurrentSlide((prev) => Math.max(prev - 1, 0));
};
  useEffect(() => {
    if (latestCourses.length === 0) return;
    const timer = setInterval(slideNext, 5000); // Change slide every 5 seconds
    return () => clearInterval(timer);
  }, [latestCourses.length]);
  useEffect(() => {
    if (!studentId) {
      navigate("/login");
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [courseData, enrollmentData, summaryData, statsData, badgeCount, profileData, badgePageData] =
    await Promise.all([
        getCourses(0, 50),
        getStudentEnrollments(studentId),
        getStudentSummary(studentId),
        getStudentStats(studentId),
        getStudentBadgeTotal(studentId),
        getStudentProfileDetails(studentId),
        getStudentBadgePage(studentId).catch(() => ({ totalPoints: 0, badges: [] })),
    ]);
    const earnedBadgePoints = badgePageData.badges
    .filter((b) => b.earned)
    .reduce((sum, b) => sum + (b.bonusPoints ?? 0), 0);

const serverTotal = summaryData.totalPoints || statsData.points;

// Use the same deriveTotalPoints logic
const correctedTotal = earnedBadgePoints > 0 
    ? Math.max(earnedBadgePoints + serverTotal, serverTotal)  // or just earnedBadgePoints + serverTotal
    : serverTotal;

        const initialYearId = profileData.yearId ?? null;
        const discoverFilters = initialYearId != null ? { yearId: initialYearId } : {};

       const [recommendedData, latestData, continueData, discoverData] = await Promise.all([
    getRecommendedCourses(studentId, 0, 3).catch(() => courseData.slice(0, 3)),
    getLatestCourses(studentId, 0, 16).catch(() => courseData.slice(0, 16)),
    getContinueLearningLesson(studentId),
    discoverCourses(0, 28, discoverFilters).catch(() => [] as Course[]),
]);

        setCourses(courseData);
        setStudentYearId(profileData.yearId ?? null);
        setEnrollments(enrollmentData);
        setSummary({ ...summaryData, totalPoints: correctedTotal });
        setStats(statsData);
        setBadgeTotal(badgeCount || badgePageData.badges.filter(b => b.earned).length);
        setRecommendedCourses(recommendedData);
        setLatestCourses(latestData);
        setContinueLesson(continueData);
        setFilterYearId(profileData.yearId ?? null);
        setBrowseCourses(discoverData.slice(0, 28));
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load your dashboard from the backend.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, studentId]);

  useEffect(() => {
    if (!studentId) return;
    try {
      const handler = () => {
        void getTotalStudentUnreadNotificationCount(studentId).then(setDashNotificationUnread);
      };
      handler();
      void sweepStudentPlannerReminders(studentId).finally(handler);
      const iv = window.setInterval(() => {
        void sweepStudentPlannerReminders(studentId).finally(handler);
      }, 65_000);
      const apiPoll = window.setInterval(handler, 75_000);
      window.addEventListener("student-notifications-changed", handler);
      return () => {
        window.clearInterval(iv);
        window.clearInterval(apiPoll);
        window.removeEventListener("student-notifications-changed", handler);
      };
    } catch {
      //
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return undefined;
    let cancelled = false;
    void api.get("/subjects").then(({ data }) => {
      const list = Array.isArray(data) ? data : [];
      if (cancelled) return;
      setSubjectOptions(
        list.map((raw: { id?: number | string; namesubject?: string; name?: string }) => ({
          id: Number(raw.id ?? 0),
          label: raw.namesubject ?? raw.name ?? "Subject",
        }))
      );
    }).catch(() => {
      if (!cancelled) setSubjectOptions([]);
    });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => {
    void getAllYears()
      .then((rows) => {
        const years = Array.isArray(rows) ? rows : [];
        setYearOptions(
          years.map((y) => ({
            id: Number(y.id ?? 0),
            label: y.label ?? y.year ?? String(y.id ?? ""),
            yearCode: y.year ?? undefined,
          }))
        );
      })
      .catch(() => setYearOptions([]));
  }, []);

  useEffect(() => {
    const streamsYear = filterYearId ?? studentYearId;
    if (!streamsYear) {
      setStreamOptions([]);
      return;
    }
    void getStreamsByYear(streamsYear)
      .then((rawList) => {
        const rows = Array.isArray(rawList) ? rawList : [];
        setStreamOptions(
          rows.map((s: Record<string, unknown>) => ({
            id: Number(s.id ?? 0),
            label: String(s.streamType && typeof (s.streamType as { namestream?: string }).namestream === "string"
              ? (s.streamType as { namestream: string }).namestream
              : s.namestream ??
                s.name ??
                s.label ??
                s.id ??
                ""),
          }))
        );
      })
      .catch(() => setStreamOptions([]));
  }, [studentYearId, filterYearId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const data = await searchLearningContent(searchQuery);
        const normalizedQuery = searchQuery.trim().toLowerCase();

        const localCourseMatches = courses.filter((course) => {
          return (
            course.title.toLowerCase().includes(normalizedQuery) ||
            course.description.toLowerCase().includes(normalizedQuery) ||
            course.teacherName.toLowerCase().includes(normalizedQuery)
          );
        });

        const mergedCourses = [
          ...localCourseMatches,
          ...data.courses.map((course) => {
            const existingCourse = courses.find((item) => item.id === course.id);
            return {
              id: course.id,
              title: course.title,
              description: course.description,
              teacherName: existingCourse?.teacherName ?? "",
              subject: existingCourse?.subject ?? "",
              stream: existingCourse?.stream ?? "",
              year: existingCourse?.year ?? "",
              substream: existingCourse?.substream ?? "",
              lessonsCount: existingCourse?.lessonsCount ?? 0,
              quizzesCount: existingCourse?.quizzesCount ?? 0,
            };
          }),
        ].filter(
          (course, index, list) =>
            list.findIndex((item) => item.id === course.id) === index
        );

        setSearchResults({
          teachers: data.teachers,
          courses: mergedCourses,
          lessons: data.lessons,
        });
      } catch (error) {
        console.error(error);
        setSearchResults({ teachers: [], courses: [], lessons: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [courses, searchQuery]);

  useEffect(() => {
    if (!searchResults?.courses.length) {
      return;
    }

    const courseIdsToLoad = searchResults.courses
      .map((course) => course.id)
      .filter((courseId) => courseId > 0 && courseQuizzes[courseId] === undefined);

    if (courseIdsToLoad.length === 0) {
      return;
    }

    void Promise.all(
      courseIdsToLoad.map(async (courseId) => {
        try {
          const quizzes = await getQuizzesByCourse(courseId);
          return { courseId, quizzes };
        } catch (error) {
          console.error(error);
          return { courseId, quizzes: [] as QuizSummary[] };
        }
      })
    ).then((results) => {
      setCourseQuizzes((previous) => {
        const next = { ...previous };
        for (const result of results) {
          next[result.courseId] = result.quizzes;
        }
        return next;
      });
    });
  }, [courseQuizzes, searchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const handleSidebarClick = (title: string) => {
    // Close sidebar on mobile
    setSidebarOpen(false);
    
    // Navigate to respective pages
    switch (title) {
      case "My Courses":
        navigate("/MyCourses");
        return;
      case "Progress":
        navigate("/Progress");
        return;
      case "Planner":
        navigate("/Planner");
        return;
      case "Badges":
        navigate("/badges");
        return;
      case "Profile":
        navigate("/profile");
        return;
      case "Home":
        setActiveItem("Home");
        return;
      default:
        setActiveItem(title);
    }
  };

  const enrolledCourses = useMemo(() => {
    const map = new Map(courses.map((course) => [course.id, course]));

    return enrollments.map((enrollment) => ({
      ...enrollment,
      course: map.get(enrollment.courseId),
    }));
  }, [courses, enrollments]);

  const reloadBrowseCourses = useCallback(
    async (streamId: number | null, subjectId: number | null, yearId: number | null) => {
        setBrowseLoading(true);
        try {
            const filters: { streamId?: number; subjectId?: number; yearId?: number } = {};
            if (streamId != null) filters.streamId = streamId;
            if (subjectId != null) filters.subjectId = subjectId;
            if (yearId != null) filters.yearId = yearId;

            // Always call with filters if any are set
            const list = await discoverCourses(0, 28, filters);
            setBrowseCourses(list); 
        } catch {
            setBrowseCourses([]); 
        } finally {
            setBrowseLoading(false);
        }
    },
    [] 
);

  useEffect(() => {
    if (loading || !studentId) return;
    void reloadBrowseCourses(filterStreamId, filterSubjectId, filterYearId);
  }, [
    studentId,
    loading,
    filterStreamId,
    filterSubjectId,
    filterYearId,
    reloadBrowseCourses,
  ]);

  const continueCourse = continueLesson?.courseId
    ? courses.find((course) => course.id === continueLesson.courseId) ?? null
    : null;

  const totalPoints = summary.totalPoints || stats.points;
  const levelInfo = getStudyLevel(totalPoints);

  const quickStats = [
    { title: "Courses", value: summary.totalEnrolledCourses || stats.enrolledCourses, icon: BookOpen },
    { title: "Completed", value: summary.totalCompletedCourses, icon: Trophy },
    { title: "Points", value: totalPoints, icon: Star },
    { title: "Badges", value: badgeTotal || summary.totalBadges, icon: Award },
  ];

  const renderCourseCard = (
    course: Pick<
      Course,
      "id" | "title" | "description" | "teacherName" | "subject" | "stream" | "year" | "substream" | "lessonsCount" | "quizzesCount"
    >
  ) => (
    <Card
      key={course.id}
      className="rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      <CardContent className="p-6">
        <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {course.teacherName ? `By ${course.teacherName}` : course.description}
        </p>
        {course.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
        )}
        <div className="flex gap-2 mb-3 flex-wrap">
          {course.subject && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {course.subject}
            </Badge>
          )}
          {course.stream && (
            <Badge variant="outline" className="rounded-full text-xs">
              {course.stream}
            </Badge>
          )}
          {course.year && (
            <Badge variant="outline" className="rounded-full text-xs">
              {course.year}
            </Badge>
          )}
          {course.substream && (
            <Badge variant="outline" className="rounded-full text-xs">
              {course.substream}
            </Badge>
          )}
        </div>
        <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
          <span>{course.lessonsCount} Lessons</span>
          <span>
            {courseQuizzes[course.id]?.length ?? course.quizzesCount} Quizzes
          </span>
        </div>
        {courseQuizzes[course.id] && courseQuizzes[course.id].length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">Related quizzes</p>
            <div className="flex flex-wrap gap-2">
              {courseQuizzes[course.id].map((quiz) => (
                <button
                  key={quiz.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/quiz/${quiz.id}`);
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {quiz.title}
                  {quiz.lessonTitle ? ` • ${quiz.lessonTitle}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}
        <Button size="sm" variant="outline" className="rounded-2xl w-full">
          View Course
        </Button>
      </CardContent>
    </Card>
  );

 const renderLatestSpotlightCard = (course: Course) => (
  <Card className="rounded-2xl min-h-[260px] border border-border bg-teal-50/70 from-indigo-50 via-background to-teal-50 shadow-md">
    <CardContent className="p-8 flex flex-col justify-between gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 mb-2">
          Fresh this week
        </p>
        <h3 className="text-2xl font-bold text-foreground leading-snug">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
          {course.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {course.subject && (
          <Badge className="rounded-full bg-teal-600/90 hover:bg-teal-600 text-white">
            {course.subject}
          </Badge>
        )}
        {course.year && (
          <Badge variant="outline" className="rounded-full border-indigo-200 text-indigo-800">
            {course.year}
          </Badge>
        )}
        <Badge variant="secondary" className="rounded-full">
          {course.lessonsCount} lessons
        </Badge>
      </div>
      <Button 
  className="rounded-2xl w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-300/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40"
  onClick={() => navigate(`/course/${course.id}`)}
>
  Open course
</Button>
    </CardContent>
  </Card>
);

  const renderHome = () => (
    <>
      <div ref={searchContainerRef} className="mb-8 relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search courses and lessons..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              if (event.target.value.trim()) setShowSearchDropdown(true);
            }}
            onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true); }}
            className="pl-12 h-14 rounded-2xl shadow-md border-border bg-teal-50/70 text-base"
          />
        </div>

        {showSearchDropdown && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full" />
                <h2 className="text-base font-semibold text-foreground">Search Results</h2>
                {!searchLoading && searchResults && (
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    {searchResults.teachers.length + searchResults.courses.length + searchResults.lessons.length} found
                  </span>
                )}
              </div>
              {searchLoading ? (
                <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm">Searching...</span>
                </div>
              ) : searchResults &&
                searchResults.teachers.length === 0 &&
                searchResults.courses.length === 0 &&
                searchResults.lessons.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-muted-foreground">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Search className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try different keywords or browse categories above.</p>
                </div>
              ) : (
                <>
                  {searchResults && searchResults.teachers.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-[10px] font-bold">T</span>
                        </div>
                        <h3 className="text-xs font-semibold text-foreground">Teachers</h3>
                        <span className="text-[10px] text-muted-foreground">({searchResults.teachers.length})</span>
                      </div>
                      <div className="space-y-2">
                        {searchResults.teachers.map((teacher) => (
                          <div
                            key={teacher.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/60 cursor-pointer transition-colors"
                            onClick={() => { setShowSearchDropdown(false); navigate(`/teachers/${teacher.id}`); }}
                          >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {teacher.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{teacher.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {teacher.courseCount} course{teacher.courseCount === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults && searchResults.courses.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-600 text-[10px] font-bold">C</span>
                        </div>
                        <h3 className="text-xs font-semibold text-foreground">Courses</h3>
                        <span className="text-[10px] text-muted-foreground">({searchResults.courses.length})</span>
                      </div>
                      <div className="space-y-2">
                        {searchResults.courses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50/60 cursor-pointer transition-colors"
                            onClick={() => { setShowSearchDropdown(false); navigate(`/course/${course.id}`); }}
                          >
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              C
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {course.teacherName ? `By ${course.teacherName}` : course.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults && searchResults.lessons.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-4 rounded-full bg-violet-100 flex items-center justify-center">
                          <span className="text-violet-600 text-[10px] font-bold">L</span>
                        </div>
                        <h3 className="text-xs font-semibold text-foreground">Lessons</h3>
                        <span className="text-[10px] text-muted-foreground">({searchResults.lessons.length})</span>
                      </div>
                      <div className="space-y-2">
                        {searchResults.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-violet-50/60 cursor-pointer transition-colors"
                            onClick={() => {
                              setShowSearchDropdown(false);
                              if (lesson.courseId) {
                                navigate(`/course/${lesson.courseId}?lesson=${lesson.id}`);
                              } else if (lesson.id) {
                                navigate(`/lesson/${lesson.id}`);
                              }
                            }}
                          >
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              L
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                              {lesson.courseTitle && (
                                <p className="text-xs text-muted-foreground truncate">{lesson.courseTitle}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {latestCourses.length > 0 && (
  <div className="mb-10 w-full max-w-6xl mx-auto">
    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">New in the last 5 days</h2>
        <p className="text-sm text-muted-foreground">
          Newest published courses at a glance.
        </p>
      </div>
      
      {/* Navigation arrows */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8"
          onClick={slidePrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8"
          onClick={slideNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>

    {/* Direct card - no white wrapper container */}
    <div className="relative">
      <div 
        ref={sliderRef}
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {latestCourses.map((course) => (
          <div 
            key={`slide-${course.id}`} 
            className="w-full flex-shrink-0"
          >
            {renderLatestSpotlightCard(course)}
          </div>
        ))}
      </div>

      {/* Dot indicators - centered under the card */}
      <div className="flex justify-center gap-2 mt-4">
        {latestCourses.map((_, idx) => (
          <button
            key={idx}
            className={`h-2 w-2 rounded-full transition-colors ${
              idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            onClick={() => setCurrentSlide(idx)}
          />
        ))}
      </div>
    </div>
  </div>
)}

      <Card className="rounded-2xl shadow-md mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current level</p>
              <Badge
                className="rounded-full px-3 py-1 font-bold mt-2"
                style={{ backgroundColor: levelInfo.current.color, color: "white" }}
              >
                {levelInfo.current.level}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">points earned</p>
            </div>
          </div>
          <Progress value={levelInfo.progress} className="h-3 rounded-full" />
          {levelInfo.next && (
            <p className="text-xs text-muted-foreground mt-2">
              {levelInfo.next.minPoints - totalPoints} points to reach {levelInfo.next.level}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <Card key={stat.title} className="rounded-2xl shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                <stat.icon className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.title}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {continueLesson && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Continue Learning</h2>
          <Card className="rounded-2xl shadow-md mb-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {continueCourse?.title ?? (continueLesson.courseTitle || continueLesson.title)}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Next lesson: {continueLesson.title}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {continueLesson.content || continueCourse?.description || "Keep going from where you stopped."}
              </p>
              <Button
                className="rounded-2xl gap-2"
                onClick={() => {
                  const cid = continueLesson.courseId ?? continueCourse?.id;
                  if (!cid) return;
                  if (continueLesson.id) navigate(`/course/${cid}?lesson=${continueLesson.id}`);
                  else navigate(`/course/${cid}`);
                }}
                disabled={!continueLesson.courseId && !continueCourse?.id}
              >
                <Play className="h-4 w-4" /> Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-10 space-y-4">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h2 className="text-xl font-semibold text-foreground">Browse courses</h2>
            <p className="text-sm text-muted-foreground">
                Filter the published catalogue by stream, year row, or subject.
            </p>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button
                variant="outline"
                className="rounded-2xl"
                disabled={browseLoading}
                onClick={() =>
                    reloadBrowseCourses(
                        filterStreamId ?? null,
                        filterSubjectId ?? null,
                        filterYearId ?? null
                    )
                }
            >
                {browseLoading ? "Loading…" : "Apply filters"}
            </Button>
            <Button
                variant="secondary"
                className="rounded-2xl"
                onClick={() => {
                    setFilterStreamId(null);
                    setFilterSubjectId(null);
                    setFilterYearId(null);
                    reloadBrowseCourses(null, null, null);
                }}
            >
                Clear
            </Button>
        </div>
    </div>

    {/* Filters dropdowns */}
    <div className={`grid grid-cols-1 gap-4 ${isMiddleSchool ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Year</label>
            <select
                value={filterYearId != null ? String(filterYearId) : ""}
                onChange={(e) => {
                    const parsed = e.target.value === "" ? NaN : Number(e.target.value);
                    setFilterYearId(Number.isFinite(parsed) ? parsed : null);
                    setFilterStreamId(null);
                }}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
                <option value="">Any year level</option>
                {yearOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
        {!isMiddleSchool && (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Stream</label>
            <select
                value={filterStreamId != null ? String(filterStreamId) : ""}
                onChange={(e) => {
                    const parsed = e.target.value === "" ? NaN : Number(e.target.value);
                    setFilterStreamId(Number.isFinite(parsed) ? parsed : null);
                }}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
                <option value="">Any stream</option>
                {streamOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
        )}
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <select
                value={filterSubjectId != null ? String(filterSubjectId) : ""}
                onChange={(e) => {
                    const parsed = e.target.value === "" ? NaN : Number(e.target.value);
                    setFilterSubjectId(Number.isFinite(parsed) ? parsed : null);
                }}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
                <option value="">Any subject</option>
                {subjectOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    </div>

    {/* Slider container for browse courses */}
    {browseCourses.length === 0 ? (
        <div className="text-center py-8">
            <p className="text-muted-foreground text-sm mb-4">No courses match these filters.</p>
        </div>
    ) : (
        <div className="relative">
            {/* Navigation arrows */}
            {browseCourses.length > 3 && (
                <div className="flex justify-end gap-2 mb-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={browseSlidePrev}
                        disabled={browseCurrentSlide === 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={browseSlideNext}
                        disabled={browseCurrentSlide >= Math.ceil(browseCourses.length / 3) - 1}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Slider */}
            <div className="overflow-hidden">
                <div
                    ref={browseSliderRef}
                    className="flex transition-transform duration-500 ease-in-out gap-4"
                    style={{ transform: `translateX(-${browseCurrentSlide * 100}%)` }}
                >
                    {browseCourses.map((course) => (
                        <div
                            key={course.id}
                            className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0"
                        >
                            <Card className="rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition-shadow h-full">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{course.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2 flex-1">
                                        {course.teacherName ? `By ${course.teacherName}` : course.description}
                                    </p>
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {course.subject && (
                                            <Badge variant="secondary" className="rounded-full text-xs">
                                                {course.subject}
                                            </Badge>
                                        )}
                                        {course.stream && (
                                            <Badge variant="outline" className="rounded-full text-xs">
                                                {course.stream}
                                            </Badge>
                                        )}
                                        {course.year && (
                                            <Badge variant="outline" className="rounded-full text-xs">
                                                {course.year}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
                                        <span>{course.lessonsCount} Lessons</span>
                                        <span>{course.quizzesCount} Quizzes</span>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="rounded-2xl w-full mt-auto"
                                        onClick={() => navigate(`/course/${course.id}`)}
                                    >
                                        View Course
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dot indicators */}
            {browseCourses.length > 3 && (
                <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: Math.ceil(browseCourses.length / 3) }).map((_, idx) => (
                        <button
                            key={idx}
                            className={`h-2 w-2 rounded-full transition-colors ${
                                idx === browseCurrentSlide ? "bg-primary" : "bg-muted-foreground/30"
                            }`}
                            onClick={() => setBrowseCurrentSlide(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    )}
</div>

      {recommendedCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recommended for You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendedCourses.map(renderCourseCard)}
          </div>
        </div>
      )}
    </>
  );

  const renderContent = () => {
    // Only render Home on DashboardStudent
    return renderHome();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full rounded-2xl shadow-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-foreground font-medium">{errorMessage}</p>
            <Button onClick={() => window.location.reload()} className="rounded-2xl">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <header className="fixed inset-x-0 top-0 h-16 border-b border-gray-200 bg-transparent backdrop-blur-md shadow-sm flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <X className="h-5 w-5 text-black" /> : <Menu className="h-5 w-5 text-black" />}
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-transparent flex items-center justify-center">
              <GraduationCap 
                className="h-10 w-14 bg-green-200 text-green-600 rounded-full p-1 cursor-pointer" 
                onClick={() => {
                  setActiveItem("Home");
                  navigate("/DeshboardStudent");
                }} 
              />
            </div>
            <span className="text-lg font-bold text-black hidden sm:block">
              EducDZ
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate("/profile")}>
            <AvatarImage src="" />
            <AvatarFallback className="bg-green-300 text-green-600 text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <span className="text-s text-black hidden sm:block">
            Welcome, <span className="font-semibold">{displayName}</span>
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
          title="Planner reminders"
          onClick={() => navigate("/student-notifications")}
        >
          <Bell className="h-10 w-10 text-green-700" />
          {dashNotificationUnread > 0 && (
            <span className="absolute top-0 right-0 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-[10px] leading-[1.15rem] text-white text-center">
              {dashNotificationUnread > 9 ? "9+" : dashNotificationUnread}
            </span>
          )}
        </Button>
      </header>

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
                  onClick={() => handleSidebarClick(item.title)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-green-300 text-white shadow"
                      : "text-gray-700 hover:bg-green-100 hover:text-green-300"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-green-600"
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
          <div className="max-w-6xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default DeshboardStudent;
