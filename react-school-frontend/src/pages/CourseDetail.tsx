import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Lock,
  Play,
  Video,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/services/authStorage";
import {
  getCourseById,
  getCourses,
  getLessonsByCourse,
  type Course,
  type Lesson,
} from "@/services/CourseService";
import {
  completeLesson,
  getCourseEnrollment,
  getCourseProgress,
} from "@/services/studentDashboardService";
import api from "@/services/api";
import { getQuizzesByCourse, type QuizSummary } from "@/services/quizService";
import { getStudentProfileDetails } from "@/services/studentProfileService";
import axios from "axios";
import { getResourceUrl } from "@/lib/resourceUrls";
import { toast } from "@/hooks/use-toast";

const YEAR_ORDER: Record<string, number> = {
  "1AM": 1, "2AM": 2, "3AM": 3, "4AM": 4,
  "1AS": 5, "2AS": 6, "3AS": 7,
};

const getYearOrder = (year: string): number => YEAR_ORDER[year.toUpperCase()] ?? -1;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = Number(getUser()?.userId ?? 0);
  const requestedLessonId = Number(searchParams.get("lesson") ?? 0) || null;

  // ========================================================================
  // STATE
  // ========================================================================

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<QuizSummary[]>([]);
  const [enrollmentProgress, setEnrollmentProgress] = useState<number | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [completingLessonId, setCompletingLessonId] = useState<number | null>(null);
  const [studentYearLabel, setStudentYearLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (!id) return;
    loadCourseData();
  }, [id, requestedLessonId, studentId]);

  // ========================================================================
  // DATA LOADING
  // ========================================================================

  const loadCourseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const courseId = Number(id);

      if (isNaN(courseId) || courseId <= 0) {
        setError("Invalid course ID");
        return;
      }

      const [courseData, courseList, profileData] = await Promise.all([
        getCourseById(courseId),
        getCourses(0, 50),
        studentId ? getStudentProfileDetails(studentId).catch(() => null) : Promise.resolve(null),
      ]);
      if (profileData) setStudentYearLabel(profileData.currentYearLabel);

      if (!courseData) {
        setError("Course not found");
        return;
      }

      setCourse(courseData);
      setAllCourses(courseList || []);
      setLessons([]);
      setCourseQuizzes([]);

      // Only load full content if student is enrolled
      if (studentId) {
        try {
          await getCourseEnrollment(studentId, courseId);
          const progress = await getCourseProgress(studentId, courseId);
          const [lessonData, quizData] = await Promise.all([
            getLessonsByCourse(courseId),
            getQuizzesByCourse(courseId),
          ]);
          setEnrollmentProgress(progress);
          setCourse({ ...courseData, quizzesCount: quizData.length });
          setLessons(lessonData || []);
          setCourseQuizzes(quizData || []);
          if (
            requestedLessonId &&
            lessonData &&
            lessonData.some((lesson) => lesson.id === requestedLessonId)
          ) {
            setExpandedLessonId(requestedLessonId);
          }
        } catch {
          // Not enrolled — enrollmentProgress stays null, content stays hidden
          setEnrollmentProgress(null);
        }
      }
    } catch (err) {
      console.error("Failed to load course:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load course. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const canEnrollByYear = (): boolean => {
    if (!studentYearLabel || !course?.year) return true;
    const studentOrder = getYearOrder(studentYearLabel);
    const courseOrder = getYearOrder(course.year);
    if (studentOrder === -1 || courseOrder === -1) return true;
    if (courseOrder > studentOrder) return false;
    return true;
  };

  const handleEnroll = async () => {
    if (!course || !studentId || enrolling) return;

    if (!canEnrollByYear()) {
      toast({
        title: "Year restriction",
        description: `This course is for ${course.year}. Your current year (${studentYearLabel}) is too low to enroll.`,
        variant: "destructive",
      });
      return;
    }

    setEnrolling(true);
    try {
      await api.post(`/students/${studentId}/courses/${course.id}/enroll`);
      const [progress, lessonData, quizData] = await Promise.all([
        getCourseProgress(studentId, course.id),
        getLessonsByCourse(course.id),
        getQuizzesByCourse(course.id),
      ]);
      setEnrollmentProgress(progress);
      setLessons(lessonData || []);
      setCourseQuizzes(quizData || []);
      setCourse((current) =>
        current
          ? { ...current, enrolledCount: current.enrolledCount + 1, quizzesCount: quizData.length }
          : current
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const responseMessage = String(
          error.response.data?.message ?? error.response.data ?? ""
        ).toLowerCase();
        if (responseMessage.includes("already enrolled")) {
          try {
            const progress = await getCourseProgress(studentId, course.id);
            setEnrollmentProgress(progress);
          } catch (err) {
            console.error("Failed to load progress:", err);
          }
          return;
        }
      }
      throw error;
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteLesson = async (lessonId: number) => {
    if (!course || !studentId || completingLessonId) return;

    setCompletingLessonId(lessonId);
    try {
      await completeLesson(studentId, lessonId);
      const progress = await getCourseProgress(studentId, course.id);
      setEnrollmentProgress(progress);
    } catch (err) {
      console.error("Failed to complete lesson:", err);
    } finally {
      setCompletingLessonId(null);
    }
  };

  // ========================================================================
  // COMPUTED
  // ========================================================================

  const isEnrolled = enrollmentProgress !== null;

  const teacherCourses = useMemo(() => {
    if (!course?.teacherId || !allCourses) return [];
    return allCourses.filter(
      (item) =>
        item.teacherId === course.teacherId &&
        item.id !== course.id &&
        item.published
    );
  }, [allCourses, course]);

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading) {
    return (
      <StudentLayout activeItem="My Courses">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </StudentLayout>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (error || !course) {
    return (
      <StudentLayout activeItem="My Courses">
        <Card className="rounded-2xl shadow-md border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-700 mb-4">
              {error || "Course not found"}
            </h1>
            <Button
              onClick={() => navigate("/DeshboardStudent")}
              className="rounded-2xl"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <StudentLayout activeItem="My Courses">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {course.subject && (
            <Badge variant="secondary" className="rounded-full">
              {course.subject}
            </Badge>
          )}
          {course.stream && (
            <Badge variant="secondary" className="rounded-full">
              {course.stream}
            </Badge>
          )}
          {course.substream && (
            <Badge variant="outline" className="rounded-full">
              {course.substream}
            </Badge>
          )}
          {course.year && (
            <Badge variant="outline" className="rounded-full">
              {course.year}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {course.title}
        </h1>
        <p className="text-muted-foreground mb-3">{course.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" /> {course.enrolledCount} students
          </span>
          <span>
            By{" "}
            <button
              type="button"
              className="font-medium text-foreground hover:text-primary"
              onClick={() =>
                course.teacherId && navigate(`/teachers/${course.teacherId}`)
              }
            >
              {course.teacherName}
            </button>
          </span>
        </div>
      </div>

      {/* Enrollment / Progress Card */}
      <Card className="rounded-2xl shadow-md mb-8">
        <CardContent className="p-6">
          {isEnrolled ? (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your Progress</span>
                <span className="font-medium text-foreground">
                  {enrollmentProgress}%
                </span>
              </div>
              <Progress value={enrollmentProgress} className="h-3 rounded-full" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-foreground">Ready to start learning?</p>
                {course.year && studentYearLabel && getYearOrder(course.year) > getYearOrder(studentYearLabel) && (
                  <p className="text-xs text-destructive mt-1">
                    This course is for {course.year}. Your current year ({studentYearLabel}) is too low to enroll.
                  </p>
                )}
              </div>
              <Button
                onClick={handleEnroll}
                className="rounded-2xl gap-2"
                disabled={enrolling || (!!course.year && !!studentYearLabel && getYearOrder(course.year) > getYearOrder(studentYearLabel))}
              >
                <Play className="h-4 w-4" />
                {enrolling ? "Enrolling..." : "Enroll Now"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lessons Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Lessons
          <Badge variant="secondary" className="rounded-full ml-auto">
            {isEnrolled ? lessons.length : course.lessonsCount}
          </Badge>
        </h2>

        {!isEnrolled ? (
          /* ── NOT ENROLLED: show locked placeholder rows ── */
          <div className="space-y-3">
            {Array.from({ length: Math.min(course.lessonsCount || 3, 5) }).map(
              (_, index) => (
                <Card key={index} className="rounded-2xl shadow-sm opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-secondary rounded w-2/3 mb-2" />
                        <div className="h-3 bg-secondary rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
            {(course.lessonsCount || 0) > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-1">
                + {course.lessonsCount - 5} more lessons after enrollment
              </p>
            )}
            <EnrollPromptCard
              message={`Enroll to unlock all ${course.lessonsCount} lesson${course.lessonsCount !== 1 ? "s" : ""}.`}
              onEnroll={handleEnroll}
              enrolling={enrolling}
              yearRestricted={!!course.year && !!studentYearLabel && getYearOrder(course.year) > getYearOrder(studentYearLabel)}
              courseYear={course.year}
              studentYear={studentYearLabel}
            />
          </div>
        ) : lessons.length > 0 ? (
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                index={index}
                isExpanded={expandedLessonId === lesson.id}
                onToggleExpand={() =>
                  setExpandedLessonId((current) =>
                    current === lesson.id ? null : lesson.id
                  )
                }
                isEnrolled={isEnrolled}
                isCompleting={completingLessonId === lesson.id}
                onComplete={() => handleCompleteLesson(lesson.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground text-center">
              No lessons available for this course yet.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quizzes Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> Quizzes
          <Badge variant="secondary" className="rounded-full ml-auto">
            {isEnrolled ? courseQuizzes.length : course.quizzesCount}
          </Badge>
        </h2>

        {!isEnrolled ? (
          /* ── NOT ENROLLED: show locked placeholder rows ── */
          <div className="space-y-3">
            {Array.from({ length: Math.min(course.quizzesCount || 2, 3) }).map(
              (_, index) => (
                <Card key={index} className="rounded-2xl shadow-sm opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-secondary rounded w-1/2 mb-2" />
                        <div className="h-3 bg-secondary rounded w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
            <EnrollPromptCard
              message={`Enroll to unlock all ${course.quizzesCount} quiz${course.quizzesCount !== 1 ? "zes" : ""}.`}
              onEnroll={handleEnroll}
              enrolling={enrolling}
              yearRestricted={!!course.year && !!studentYearLabel && getYearOrder(course.year) > getYearOrder(studentYearLabel)}
              courseYear={course.year}
              studentYear={studentYearLabel}
            />
          </div>
        ) : courseQuizzes.length > 0 ? (
          <div className="space-y-3">
            {courseQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground text-center">
              No quizzes are available for this course yet.
            </CardContent>
          </Card>
        )}
      </div>

      {/* More by Teacher Section — always visible */}
      {teacherCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            More by {course.teacherName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teacherCourses.map((teacherCourse) => (
              <Card
                key={teacherCourse.id}
                className="rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/course/${teacherCourse.id}`)}
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-1">
                    {teacherCourse.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {teacherCourse.description}
                  </p>
                  <div className="flex gap-2">
                    {teacherCourse.stream && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {teacherCourse.stream}
                      </Badge>
                    )}
                    {teacherCourse.year && (
                      <Badge variant="outline" className="rounded-full text-xs">
                        {teacherCourse.year}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </StudentLayout>
  );
};



interface EnrollPromptCardProps {
  message: string;
  onEnroll: () => void;
  enrolling: boolean;
  yearRestricted?: boolean;
  courseYear?: string;
  studentYear?: string;
}

const EnrollPromptCard = ({ message, onEnroll, enrolling, yearRestricted, courseYear, studentYear }: EnrollPromptCardProps) => (
  <Card className={`rounded-2xl shadow-sm border-dashed border-2 ${yearRestricted ? "border-red-300 bg-red-50" : "border-primary/30 bg-primary/5"}`}>
    <CardContent className="p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Lock className={`h-5 w-5 shrink-0 ${yearRestricted ? "text-red-500" : "text-primary"}`} />
        <div>
          <p className="text-sm text-foreground">{yearRestricted ? "Year restriction" : message}</p>
          {yearRestricted && (
            <p className="text-xs text-destructive mt-1">
              This course is for {courseYear}. Your current year ({studentYear}) is too low to enroll.
            </p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={onEnroll}
        disabled={enrolling || yearRestricted}
        className="rounded-2xl gap-2 shrink-0"
      >
        <Play className="h-3 w-3" />
        {enrolling ? "Enrolling..." : "Enroll Now"}
      </Button>
    </CardContent>
  </Card>
);

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isEnrolled: boolean;
  isCompleting: boolean;
  onComplete: () => void;
}

const LessonCard = ({
  lesson,
  index,
  isExpanded,
  onToggleExpand,
  isEnrolled,
  isCompleting,
  onComplete,
}: LessonCardProps) => (
  <Card
    className="rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    onClick={onToggleExpand}
  >
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
          {lesson.orderNumber || index + 1}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{lesson.title}</h3>
          <p className="text-sm text-muted-foreground">
            {lesson.content || "Lesson content available inside the course."}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-sm text-foreground">
            {lesson.content || "No written content for this lesson."}
          </p>
          <div className="flex flex-wrap gap-2">
            {lesson.videoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-2xl gap-2"
                onClick={(event) => {
                  event.stopPropagation();
                  window.open(
                    getResourceUrl(lesson.videoUrl),
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                <Video className="h-4 w-4" /> Open Video
              </Button>
            )}
            {lesson.pdfUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-2xl gap-2"
                onClick={(event) => {
                  event.stopPropagation();
                  window.open(
                    getResourceUrl(lesson.pdfUrl),
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                <FileText className="h-4 w-4" /> Open PDF
              </Button>
            )}
            {isEnrolled && (
              <Button
                type="button"
                size="sm"
                className="rounded-2xl"
                disabled={isCompleting}
                onClick={(event) => {
                  event.stopPropagation();
                  onComplete();
                }}
              >
                {isCompleting ? "Saving..." : "Mark Complete"}
              </Button>
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

interface QuizCardProps {
  quiz: QuizSummary;
  onClick: () => void;
}

const QuizCard = ({ quiz, onClick }: QuizCardProps) => (
  <Card
    className="rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-foreground">{quiz.title}</h3>
          <p className="text-sm text-muted-foreground">
            {quiz.lessonTitle ? `Lesson quiz • ${quiz.lessonTitle}` : "Course quiz"}
          </p>
          {quiz.description && (
            <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
          )}
        </div>
        <Badge variant="outline" className="rounded-full text-xs shrink-0">
          {quiz.totalQuestions} Questions
        </Badge>
      </div>
    </CardContent>
  </Card>
);

export default CourseDetail;