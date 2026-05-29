import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  ClipboardList,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Filter,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  Video,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getUser } from "@/services/authStorage";
import { logoutUser } from "@/services/authService";
import {
  createTeacherCourse,
  createTeacherLesson,
  createTeacherQuiz,
  deleteTeacherCourse,
  deleteTeacherLesson,
  deleteTeacherQuiz,
  getCourseStudents,
  getTeacherCourseOptions,
  getSubjectOptions,
  getAllTeacherCourses,
  getTeacherLessons,
  getTeacherNotifications,
  getTeacherQuizzes,
  publishTeacherCourse,
  uploadTeacherResource,
  updateTeacherCourse,
  updateTeacherLesson,
  updateTeacherQuiz,
  type CourseStudent,
  type SubjectOption,
  type TeacherCourse,
  type TeacherCourseOption,
  type TeacherLesson,
  type TeacherQuiz,
  type TeacherQuizQuestion,
} from "@/services/teacherDashboardService";
import { years } from "@/lib/schoolOptions";
import AppBackground from "@/components/AppBackground";
import CourseDialog from "@/components/CourseDialog";
import { getResourceUrl } from "@/lib/resourceUrls";
import { useNavigate, useSearchParams } from "react-router-dom";

const sidebarItems = [
  { title: "Overview", icon: Home },
  { title: "Lessons", icon: Video },
  { title: "Courses", icon: BookOpen },
  { title: "Quizzes", icon: ClipboardList },
  { title: "Profile", icon: User },
];

type QuestionType = TeacherQuizQuestion["type"];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const teacherId = user?.userId;
  const userName = user?.name ?? "Teacher";
  const teacherSubjectName = user?.teacher?.subject ?? "";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<TeacherCourseOption[]>([]);
  // Replaces the old `notifications` array — we only need to know if any are unread
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonCourseFilter, setLessonCourseFilter] = useState("all");

  const [lessonDialog, setLessonDialog] = useState(false);
  const [courseDialog, setCourseDialog] = useState(false);
  const [quizDialog, setQuizDialog] = useState(false);
  const [viewQuizDialog, setViewQuizDialog] = useState(false);
  const [studentsDialog, setStudentsDialog] = useState(false);

  const [selectedStudents, setSelectedStudents] = useState<CourseStudent[]>([]);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");
  const [editingLesson, setEditingLesson] = useState<TeacherLesson | null>(null);
  const [editingCourse, setEditingCourse] = useState<TeacherCourse | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<TeacherQuiz | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<TeacherQuiz | null>(null);

  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "video" as "video" | "pdf",
    url: "",
    description: "",
    assignToCourse: "no" as "yes" | "no",
    courseId: "",
  });
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonUploadError, setLessonUploadError] = useState("");
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    year: "",
  });
  const [quizForm, setQuizForm] = useState({
    title: "",
    courseId: "",
    lessonId: "",
    questions: [] as TeacherQuizQuestion[],
  });

  const createDefaultMcqQuestion = () => ({
    question: "",
    type: "mcq" as QuestionType,
    options: ["", ""],
    correctAnswer: [] as number[],
  });

  const [newQuestion, setNewQuestion] = useState<{
    question: string;
    type: QuestionType;
    options: string[];
    correctAnswer: number[] | string;
  }>(createDefaultMcqQuestion());

  const [saving, setSaving] = useState(false);

  const syncCourseOptions = (nextCourses: TeacherCourse[]) => {
    setCourseOptions(nextCourses.map((course) => ({ id: course.id, title: course.title })));
  };

  const getCorrectAnswerIndexes = (
    correctAnswer: TeacherQuizQuestion["correctAnswer"]
  ): number[] => {
    if (Array.isArray(correctAnswer)) return correctAnswer;
    if (typeof correctAnswer === "number") return [correctAnswer];
    const parsed = Number(correctAnswer);
    return Number.isNaN(parsed) ? [] : [parsed];
  };

  const getOptionText = (option: any): string => {
    if (typeof option === "string") return option;
    return option?.optionText ?? "";
  };

  const loadDashboard = async (options?: { showFullPageLoading?: boolean }) => {
    if (!teacherId) {
      navigate("/login");
      return;
    }

    const showFullPageLoading = options?.showFullPageLoading !== false;
    if (showFullPageLoading) {
      setLoading(true);
    }
    try {
      const [coursesResult, subjectsResult] = await Promise.allSettled([
        getAllTeacherCourses(teacherId),
        getSubjectOptions(),
      ]);
      const teacherCourses = (coursesResult.status === "fulfilled" ? coursesResult.value : []) as TeacherCourse[];
      const subjectOptions = (subjectsResult.status === "fulfilled" ? subjectsResult.value : []) as SubjectOption[];

      const [lessonsResult, quizzesResult, courseOptionsResult] = await Promise.allSettled([
        getTeacherLessons(teacherId, teacherCourses),
        getTeacherQuizzes(teacherId),
        getTeacherCourseOptions(teacherId),
      ]);

      const teacherLessonsRaw = lessonsResult.status === "fulfilled" ? lessonsResult.value : [];
      const teacherQuizzes = quizzesResult.status === "fulfilled" ? quizzesResult.value : ([] as TeacherQuiz[]);
      const teacherCourseOptions = courseOptionsResult.status === "fulfilled" ? courseOptionsResult.value : ([] as TeacherCourseOption[]);

      const teacherLessons = teacherLessonsRaw.filter((lesson): lesson is TeacherLesson => lesson != null);
      setCourses(teacherCourses);
      setLessons(teacherLessons);
      setQuizzes(teacherQuizzes);
      setSubjects(subjectOptions);
      setCourseOptions(
        teacherCourseOptions.length > 0
          ? teacherCourseOptions
          : teacherCourses.map((course) => ({ id: course.id, title: course.title }))
      );

      // Fetch notifications and cross-reference with locally-persisted read IDs.
      // This way the red dot respects what the teacher already marked read on the
      // notifications page, even after a full page refresh.
      const notificationData = await getTeacherNotifications(teacherId).catch(() => []);
      const persistedReadIds: Set<number> = (() => {
        try {
          const raw = localStorage.getItem(`notif_read_ids_${teacherId}`);
          return new Set(raw ? (JSON.parse(raw) as number[]) : []);
        } catch {
          return new Set<number>();
        }
      })();
      const hasUnread = notificationData.some((n) => !n.read && !persistedReadIds.has(n.id));
      setHasUnreadNotifications(hasUnread);
    } finally {
      if (showFullPageLoading) {
        setLoading(false);
      }
    }
  };

  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (!teacherId) return;
    void loadDashboard();
  }, [teacherId]);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const filteredLessons = useMemo(() => {
    return lessons
      .filter((lesson): lesson is TeacherLesson => lesson != null)
      .filter((lesson) => {
        const matchSearch =
          lesson.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
          lesson.description.toLowerCase().includes(lessonSearch.toLowerCase());
        const matchCourse =
          lessonCourseFilter === "all" ||
          String(lesson.courseId ?? "") === lessonCourseFilter ||
          (!lesson.courseId && lessonCourseFilter === "none");
        return matchSearch && matchCourse;
      });
  }, [lessonCourseFilter, lessonSearch, lessons]);

  const resetNewQuestion = () => setNewQuestion(createDefaultMcqQuestion());

  const openAddLesson = () => {
    setEditingLesson(null);
    setLessonForm({ title: "", type: "video", url: "", description: "", assignToCourse: "no", courseId: "" });
    setLessonFile(null);
    setLessonUploadError("");
    setLessonDialog(true);
  };

  const openEditLesson = (lesson: TeacherLesson) => {
    const idInvalid = lesson.id == null || (typeof lesson.id === "number" && lesson.id <= 0);
    if (idInvalid) {
      alert("This lesson has an invalid ID and cannot be edited. Please refresh the page or contact support.");
      return;
    }
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      type: lesson.type,
      url: lesson.url,
      description: lesson.description,
      assignToCourse: lesson.courseId ? "yes" : "no",
      courseId: lesson.courseId ? String(lesson.courseId) : "",
    });
    setLessonFile(null);
    setLessonUploadError("");
    setLessonDialog(true);
  };

  const openLesson = (lesson: TeacherLesson) => {
    if (lesson.url) {
      window.open(getResourceUrl(lesson.url), "_blank", "noopener,noreferrer");
    }
  };

  const saveLesson = async () => {
    if (!lessonForm.title) return;
    setLessonUploadError("");

    if (lessonForm.assignToCourse === "yes" && !lessonForm.courseId) {
      setLessonUploadError("Please choose a course for this lesson.");
      return;
    }

    let finalUrl = lessonForm.url;
    if (lessonFile) {
      try {
        const uploaded = await uploadTeacherResource(lessonFile);
        finalUrl = uploaded.url;
      } catch (error) {
        console.error(error);
        setLessonUploadError("File upload failed. You can retry or paste the server URL manually.");
        return;
      }
    }

    setSaving(true);
    try {
      if (editingLesson) {
        await updateTeacherLesson(editingLesson.id, {
          title: lessonForm.title,
          description: lessonForm.description,
          type: lessonForm.type,
          url: finalUrl,
          courseId: lessonForm.assignToCourse === "yes" ? Number(lessonForm.courseId) : undefined,
        });
      } else {
        const created = await createTeacherLesson({
          title: lessonForm.title,
          description: lessonForm.description,
          type: lessonForm.type,
          url: finalUrl,
          teacherId: teacherId,
          courseId: lessonForm.assignToCourse === "yes" ? Number(lessonForm.courseId) : undefined,
        });
        if (created) {
          setLessons((prev) => {
            if (prev.some((l) => l.id === created.id)) return prev;
            return [...prev, created];
          });
        }
      }
      setLessonDialog(false);
      setLessonFile(null);
      await loadDashboard({ showFullPageLoading: false });
    } catch (error: any) {
      console.error("Error:", error);
      if (error.response?.status === 400) {
        setLessonUploadError("Server rejected the update. Check lesson details and try again.");
      } else if (error.message?.includes("Invalid lesson ID")) {
        setLessonUploadError("Invalid lesson ID. Please refresh the page.");
      } else {
        setLessonUploadError("Failed to save lesson. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lesson: TeacherLesson) => {
    await deleteTeacherLesson(lesson.id, lesson.courseId);
    await loadDashboard();
  };

  const openAddCourse = () => {
    setEditingCourse(null);
    setCourseForm({ title: "", description: "", year: "" });
    setCourseDialog(true);
  };

  const openEditCourse = (course: TeacherCourse) => {
    setEditingCourse(course);
    setCourseForm({ title: course.title, description: course.description, year: course.year });
    setCourseDialog(true);
  };

  const handleDeleteCourse = async (courseId: number) => {
    await deleteTeacherCourse(courseId);
    await loadDashboard();
  };

  const togglePublish = async (course: TeacherCourse) => {
    try {
      await publishTeacherCourse(course.id, course.published);
      await loadDashboard({ showFullPageLoading: false });
    } catch (error: unknown) {
      console.error("Toggle publish failed:", error);
      const ax = error as { response?: { data?: unknown } };
      let msg =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : (ax.response?.data as { message?: string } | undefined)?.message;
      if (!msg && typeof ax.response?.data === "object" && ax.response?.data !== null) {
        msg = JSON.stringify(ax.response?.data);
      }
      alert(
        msg?.trim()
          ? String(msg)
          : course.published
            ? "Could not unpublish (courses with active students cannot be unpublished)."
            : "Cannot publish (add at least one lesson to your course)."
      );
    }
  };

  const viewStudents = async (course: TeacherCourse) => {
    const students = await getCourseStudents(course.id);
    setSelectedStudents(students);
    setSelectedCourseTitle(course.title);
    setStudentsDialog(true);
  };

  const openAddQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({ title: "", courseId: "", lessonId: "", questions: [] });
    resetNewQuestion();
    setQuizDialog(true);
  };

  const openEditQuiz = (quiz: TeacherQuiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      courseId: quiz.courseId ? String(quiz.courseId) : "",
      lessonId: quiz.lessonId ? String(quiz.lessonId) : "",
      questions: quiz.questions,
    });
    resetNewQuestion();
    setQuizDialog(true);
  };

  const openViewQuiz = (quiz: TeacherQuiz) => {
    setSelectedQuiz(quiz);
    setViewQuizDialog(true);
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    if (type === "true_false") {
      setNewQuestion({ question: "", type, options: ["True", "False"], correctAnswer: [0] });
      return;
    }
    if (type === "short_answer") {
      setNewQuestion({ question: "", type, options: [], correctAnswer: "" });
      return;
    }
    setNewQuestion(createDefaultMcqQuestion());
  };

  const updateMcqOption = (optionIndex: number, value: string) => {
    setNewQuestion((prev) => {
      if (prev.type !== "mcq" || optionIndex < 0 || optionIndex >= prev.options.length) return prev;
      const options = [...prev.options];
      options[optionIndex] = value;
      return { ...prev, options };
    });
  };

  const addMcqOption = () => {
    setNewQuestion((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const removeMcqOption = (index: number) => {
    setNewQuestion((prev) => {
      const options = prev.options.filter((_, i) => i !== index);
      const updatedCorrect = getCorrectAnswerIndexes(prev.correctAnswer)
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));
      return { ...prev, options, correctAnswer: updatedCorrect };
    });
  };

  const toggleCorrectMcqOption = (index: number) => {
    setNewQuestion((prev) => {
      const current = getCorrectAnswerIndexes(prev.correctAnswer);
      const updated = current.includes(index) ? current.filter((i) => i !== index) : [...current, index];
      return { ...prev, correctAnswer: updated };
    });
  };

  const addQuestionToQuiz = () => {
    const questionText = newQuestion.question.trim();
    if (!questionText) return;

    if (newQuestion.type === "mcq") {
      const options = newQuestion.options.map((option) => option.trim());
      if (options.length < 2 || options.some((option) => option.length === 0)) {
        alert("Please add at least 2 non-empty options for this MCQ.");
        return;
      }
      const correctAnswerIndex = getCorrectAnswerIndexes(newQuestion.correctAnswer);
      if (
        correctAnswerIndex.length === 0 ||
        correctAnswerIndex.some((index) => index < 0 || index >= options.length)
      ) {
        alert("Please select at least one correct answer for this MCQ.");
        return;
      }
      setQuizForm((prev) => ({
        ...prev,
        questions: [
          ...prev.questions,
          { id: String(Date.now()), question: questionText, type: "mcq", options, correctAnswer: correctAnswerIndex },
        ],
      }));
      resetNewQuestion();
      return;
    }

    if (newQuestion.type === "true_false") {
      const correctAnswer = Number(newQuestion.correctAnswer);
      setQuizForm((prev) => ({
        ...prev,
        questions: [
          ...prev.questions,
          { id: String(Date.now()), question: questionText, type: "true_false", options: ["True", "False"], correctAnswer: [correctAnswer === 1 ? 1 : 0] },
        ],
      }));
      resetNewQuestion();
      return;
    }

    const shortAnswer = String(newQuestion.correctAnswer).trim();
    if (!shortAnswer) {
      alert("Please provide the correct answer text.");
      return;
    }
    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: String(Date.now()), question: questionText, type: "short_answer", options: [], correctAnswer: shortAnswer },
      ],
    }));
    resetNewQuestion();
  };

  const removeQuestion = (id: string) =>
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((question) => question.id !== id),
    }));

  const saveQuiz = async () => {
    if (!quizForm.title) return;
    console.log("QUIZ FORM STATE:", quizForm);
    const payload = {
      title: quizForm.title,
      courseId: quizForm.courseId ? Number(quizForm.courseId) : undefined,
      lessonId: quizForm.lessonId ? Number(quizForm.lessonId) : undefined,
      questions: quizForm.questions,
    };
    console.log("PAYLOAD QUESTIONS:", payload.questions);
    if (editingQuiz) {
      await updateTeacherQuiz(editingQuiz.id, payload);
    } else {
      await createTeacherQuiz(payload);
    }
    setQuizDialog(false);
    await loadDashboard();
  };

  const handleDeleteQuiz = async (quizId: number) => {
    await deleteTeacherQuiz(quizId);
    await loadDashboard();
  };

  const renderOverview = () => (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            <span className="text-3xl font-bold text-foreground">{lessons.length}</span>
            <span className="text-sm text-muted-foreground">Lessons</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-3xl font-bold text-foreground">{courses.length}</span>
            <span className="text-sm text-muted-foreground">Courses</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            <span className="text-3xl font-bold text-foreground">{quizzes.length}</span>
            <span className="text-sm text-muted-foreground">Quizzes</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderLessons = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Lessons</h2>
        <Button onClick={openAddLesson} className="rounded-2xl gap-2">
          <Plus className="h-4 w-4" /> Add Lesson
        </Button>
      </div>
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={lessonSearch}
            onChange={(event) => setLessonSearch(event.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
        <Select value={lessonCourseFilter} onValueChange={setLessonCourseFilter}>
          <SelectTrigger className="w-48 rounded-2xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="none">No Course</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={String(course.id)}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredLessons.map((lesson) => (
          <Card key={lesson.id} className="rounded-2xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {lesson.type === "video" ? (
                    <Video className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                  <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openLesson(lesson)} title="Open lesson">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditLesson(lesson)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLesson(lesson)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{lesson.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="rounded-full text-xs">
                  {lesson.type.toUpperCase()}
                </Badge>
                {lesson.courseTitle && (
                  <Badge variant="outline" className="rounded-full text-xs">
                    {lesson.courseTitle}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCourses = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Courses</h2>
        <Button onClick={openAddCourse} className="rounded-2xl gap-2">
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </div>
      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id} className="rounded-2xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">{course.title}</h3>
                    <Badge variant={course.published ? "default" : "secondary"} className="rounded-full text-xs">
                      {course.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Created: {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                  {(course.year || course.stream || course.substream) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {course.year && <Badge>{course.year}</Badge>}
                      {course.stream && <Badge>{course.stream}</Badge>}
                      {course.substream && <Badge>{course.substream}</Badge>}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePublish(course)}
                    disabled={course.published && course.enrolledCount > 0}
                    title={
                      course.published && course.enrolledCount > 0
                        ? "Cannot unpublish while students are actively enrolled"
                        : course.published
                          ? "Click to unpublish"
                          : "Click to publish"
                    }
                    className={
                      course.published
                        ? "text-green-600 hover:text-red-500 hover:bg-red-50"
                        : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                    }
                  >
                    {course.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => viewStudents(course)}>
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditCourse(course)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
                  <div className="text-xs text-muted-foreground mb-1">
                  Teacher: <span className="font-medium text-foreground">{course.teacherName || userName}</span>
                </div>
                  <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Video className="h-4 w-4" /> {lessons.filter((lesson) => lesson.courseId === course.id).length} Lessons
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" /> {quizzes.filter((quiz) => quiz.courseId === course.id).length} Quizzes
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {course.enrolledCount} Students
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderQuizzes = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Quizzes</h2>
        <Button onClick={openAddQuiz} className="rounded-2xl gap-2">
          <Plus className="h-4 w-4" /> Add Quiz
        </Button>
      </div>
      <div className="space-y-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="rounded-2xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{quiz.title}</h3>
                  <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                    {quiz.courseTitle && <span>Course: {quiz.courseTitle}</span>}
                    {quiz.lessonTitle && <span>Lesson: {quiz.lessonTitle}</span>}
                    <span>{quiz.questions.length} Questions</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {quiz.questions.map((question) => (
                      <Badge key={question.id} variant="outline" className="rounded-full text-xs capitalize">
                        {question.type.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => openViewQuiz(quiz)}>
                    View Content
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditQuiz(quiz)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuiz(quiz.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "Lessons":
        return renderLessons();
      case "Courses":
        return renderCourses();
      case "Quizzes":
        return renderQuizzes();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Loading teacher dashboard...
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
                onClick={() => navigate("/teacher-dashboard")}
              />
            </div>
            <span className="text-lg font-bold text-black hidden sm:block">EducDZ</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate("/teacher-profile")}>
            <AvatarImage src="" />
            <AvatarFallback className="bg-green-300 text-green-900 text-l">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground hidden sm:block">
            Welcome, <span className="font-semibold">{userName}</span>
          </span>
        </div>
        {/* Bell navigates to the notifications page; red dot uses localStorage-aware unread check */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {hasUnreadNotifications && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
          )}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden pt-16">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed top-16 bottom-0 left-0 z-20 w-56 bg-card border-r border-border transition-transform duration-200 ease-in-out flex flex-col`}
        >
          <nav className="p-3 space-y-1 mt-4 flex-1">
            {sidebarItems.map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  if (item.title === "Profile") {
                    navigate("/teacher-profile");
                    setSidebarOpen(false);
                    return;
                  }
                  setActiveTab(item.title);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                  activeTab === item.title
                    ? "bg-green-300 text-green-900"
                    : "text-gray-700 hover:bg-green-300 hover:text-green-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </button>
            ))}
          </nav>
          <div className="p-3 mb-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
          <div className="max-w-5xl mx-auto">{renderContent()}</div>
        </main>
      </div>

      {/* DIALOGS */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Lesson title"
              value={lessonForm.title}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-2xl"
            />
            <Select
              value={lessonForm.type}
              onValueChange={(value) => setLessonForm((prev) => ({ ...prev, type: value as "video" | "pdf" }))}
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Resource URL"
              value={lessonForm.url}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, url: event.target.value }))}
              className="rounded-2xl"
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">
                Upload {lessonForm.type === "pdf" ? "PDF" : "Video"} from device
              </label>
              <input
                type="file"
                accept={lessonForm.type === "pdf" ? "application/pdf" : "video/*"}
                onChange={(event) => setLessonFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />
              {lessonFile && (
                <p className="text-xs text-muted-foreground">Selected file: {lessonFile.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Pick a local file to upload it, or paste an existing hosted URL above.
              </p>
              {lessonUploadError && <p className="text-xs text-destructive">{lessonUploadError}</p>}
            </div>
            <Textarea
              placeholder="Description"
              value={lessonForm.description}
              onChange={(event) => setLessonForm((prev) => ({ ...prev, description: event.target.value }))}
              className="rounded-2xl"
            />
            <div className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
              <label className="text-sm font-medium text-foreground block">Course relation</label>
              <p className="text-xs text-muted-foreground">
                Choose whether this lesson should stay independent or be attached to one of the teacher's courses.
              </p>
              <Select
                value={lessonForm.assignToCourse}
                onValueChange={(value) =>
                  setLessonForm((prev) => ({
                    ...prev,
                    assignToCourse: value as "yes" | "no",
                    courseId: value === "yes" ? prev.courseId : "",
                  }))
                }
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Course relation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Independent lesson</SelectItem>
                  <SelectItem value="yes">Assign to one of my courses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {lessonForm.assignToCourse === "yes" && (
              <div className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
                <label className="text-sm font-medium text-foreground block">Teacher courses</label>
                <p className="text-xs text-muted-foreground">
                  Loaded {courseOptions.length} course{courseOptions.length === 1 ? "" : "s"} available.
                </p>
                <Select
                  value={lessonForm.courseId || ""}
                  onValueChange={(value) => setLessonForm((prev) => ({ ...prev, courseId: value }))}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Choose one of your courses" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLessonDialog(false)}
              className="rounded-2xl"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={saveLesson} className="rounded-2xl" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CourseDialog
        open={courseDialog}
        onOpenChange={setCourseDialog}
        editingCourse={editingCourse}
        subjects={subjects}
        teacherId={teacherId}
        teacherSubjectName={teacherSubjectName}
        onSaved={loadDashboard}
      />

      <Dialog open={quizDialog} onOpenChange={setQuizDialog}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Edit Quiz" : "Add Quiz"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Quiz title"
              value={quizForm.title}
              onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-2xl"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Assign to Course</label>
                <Select
                  value={quizForm.courseId || "none"}
                  onValueChange={(value) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      courseId: value === "none" ? "" : value,
                      lessonId: value === "none" ? prev.lessonId : "",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Assign to Lesson</label>
                <Select
                  value={quizForm.lessonId || "none"}
                  onValueChange={(value) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      lessonId: value === "none" ? "" : value,
                      courseId: value === "none" ? prev.courseId : "",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {lessons
                      .filter((lesson) => lesson && lesson.id)
                      .map((lesson) => (
                        <SelectItem key={lesson.id} value={String(lesson.id)}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">
                Questions ({quizForm.questions.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {quizForm.questions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between bg-secondary rounded-2xl px-3 py-2">
                    <div>
                      <span className="text-sm text-foreground">
                        {index + 1}. {question.question}
                      </span>
                      <Badge variant="outline" className="ml-2 rounded-full text-xs capitalize">
                        {question.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border rounded-2xl p-3 space-y-3">
              <h4 className="text-sm font-medium text-foreground">Add Question</h4>
              <Select value={newQuestion.type} onValueChange={(value) => handleQuestionTypeChange(value as QuestionType)}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Question"
                value={newQuestion.question}
                onChange={(event) => setNewQuestion((prev) => ({ ...prev, question: event.target.value }))}
                className="rounded-2xl"
              />

              {newQuestion.type === "mcq" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(event) => {
                            const options = [...newQuestion.options];
                            options[index] = event.target.value;
                            setNewQuestion((prev) => ({ ...prev, options }));
                          }}
                          className="rounded-2xl"
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeMcqOption(index)}>
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addMcqOption} className="rounded-2xl mt-2">
                    + Add Option
                  </Button>
                  <div className="space-y-2 mt-4 rounded-2xl border border-border bg-card/50 p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground block">
                        Correct answers (select one or more):
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {getCorrectAnswerIndexes(newQuestion.correctAnswer).length} selected
                      </span>
                    </div>
                    <div className="space-y-2">
                      {newQuestion.options.map((option, index) => {
                        const isSelected = getCorrectAnswerIndexes(newQuestion.correctAnswer).includes(index);
                        return (
                          <label
                            key={index}
                            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCorrectMcqOption(index)}
                              className="w-4 h-4 cursor-pointer accent-emerald-600"
                            />
                            <span className="flex-1 min-w-0">
                              <span className="text-sm text-foreground font-medium block">
                                Option {index + 1}
                              </span>
                              <span className="text-xs text-muted-foreground block truncate">
                                {option || "Enter option text above"}
                              </span>
                            </span>
                            {isSelected && (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full shrink-0">
                                ✓ Correct
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    {getCorrectAnswerIndexes(newQuestion.correctAnswer).length === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-2">
                        ⚠️ Please select at least one correct answer
                      </p>
                    )}
                  </div>
                </>
              )}

              {newQuestion.type === "true_false" && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-muted-foreground">Correct:</label>
                  <Select
                    value={String(newQuestion.correctAnswer)}
                    onValueChange={(value) => setNewQuestion((prev) => ({ ...prev, correctAnswer: [Number(value)] as number[] }))}
                  >
                    <SelectTrigger className="w-24 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">True</SelectItem>
                      <SelectItem value="1">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newQuestion.type === "short_answer" && (
                <Input
                  placeholder="Correct answer"
                  value={String(newQuestion.correctAnswer)}
                  onChange={(event) => setNewQuestion((prev) => ({ ...prev, correctAnswer: event.target.value }))}
                  className="rounded-2xl"
                />
              )}

              <Button onClick={addQuestionToQuiz} size="sm" className="rounded-2xl gap-1">
                <Plus className="h-3 w-3" /> Add Question
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizDialog(false)} className="rounded-2xl">
              Cancel
            </Button>
            <Button onClick={saveQuiz} className="rounded-2xl">
              Save Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewQuizDialog} onOpenChange={setViewQuizDialog}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.title ?? "Quiz Content"}</DialogTitle>
          </DialogHeader>
          {selectedQuiz && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {selectedQuiz.courseTitle && (
                  <Badge variant="outline" className="rounded-full">
                    Course: {selectedQuiz.courseTitle}
                  </Badge>
                )}
                {selectedQuiz.lessonTitle && (
                  <Badge variant="outline" className="rounded-full">
                    Lesson: {selectedQuiz.lessonTitle}
                  </Badge>
                )}
                <Badge variant="secondary" className="rounded-full">
                  {selectedQuiz.questions.length} Questions
                </Badge>
              </div>

              <div className="space-y-3">
                {selectedQuiz.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions found for this quiz.</p>
                ) : (
                  selectedQuiz.questions.map((question, index) => (
                    <div key={question.id} className="rounded-2xl border border-border bg-card/70 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Question {index + 1}</span>
                        <Badge variant="outline" className="rounded-full text-xs capitalize">
                          {question.type.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-sm text-foreground">{question.question}</p>

                      {question.type === "mcq" && question.options.length > 0 && (
                        <>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => {
                              const isCorrect = getCorrectAnswerIndexes(question.correctAnswer).includes(optionIndex);
                              return (
                                <div
                                  key={`${question.id}-${optionIndex}`}
                                  className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                                    isCorrect
                                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-medium"
                                      : "border-border bg-background text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span>{getOptionText(option)}</span>
                                    {isCorrect && (
                                      <span className="text-xs font-semibold uppercase tracking-wide">✓ Correct</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">
                              {getCorrectAnswerIndexes(question.correctAnswer).length > 1
                                ? `Multiple correct answers: ${getCorrectAnswerIndexes(question.correctAnswer).length}`
                                : "Single correct answer"}
                            </p>
                          </div>
                        </>
                      )}

                      {question.type === "true_false" && question.options.length > 0 && (
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const isCorrect = getCorrectAnswerIndexes(question.correctAnswer).includes(optionIndex);
                            return (
                              <div
                                key={`${question.id}-${optionIndex}`}
                                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                                  isCorrect
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-medium"
                                    : "border-border bg-background text-foreground"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span>{getOptionText(option)}</span>
                                  {isCorrect && (
                                    <span className="text-xs font-semibold uppercase tracking-wide">✓ Correct</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.type === "short_answer" && (
                        <div className="rounded-xl border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 space-y-1">
                          <div className="font-medium">Correct answer:</div>
                          <div className="font-semibold">{String(question.correctAnswer)}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewQuizDialog(false)} className="rounded-2xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={studentsDialog} onOpenChange={setStudentsDialog}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enrolled Students - {selectedCourseTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No students enrolled yet.</p>
            ) : (
              selectedStudents.map((student, index) => (
                <div key={student.id || index} className="flex items-center gap-3 p-3 bg-secondary rounded-2xl">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {student.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm text-foreground block">{student.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {student.status} · {student.progressPercent}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;