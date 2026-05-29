import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, ClipboardList, FileText, Play, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StudentLayout from "@/components/StudentLayout";
import { getLessonById, type Lesson } from "@/services/CourseService";
import { getUser } from "@/services/authStorage";
import { completeLesson } from "@/services/studentDashboardService";
import { getQuizzesByLesson, type QuizSummary } from "@/services/quizService";
import { getResourceUrl } from "@/lib/resourceUrls";

const LessonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = Number(getUser()?.userId ?? 0);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const loadLesson = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const lessonData = await getLessonById(Number(id));
        setLesson(lessonData);

        const quizData = await getQuizzesByLesson(Number(id)).catch(() => []);
        setQuizzes(quizData);
      } catch (error) {
        console.error(error);
        setLesson(null);
        setErrorMessage("Unable to load this lesson from the backend.");
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [id]);

  const handleComplete = async () => {
    if (!lesson || completing || completed) return;
    setCompleting(true);
    try {
      await completeLesson(studentId, lesson.id);
      setCompleted(true);
    } catch (error) {
      console.error("Failed to complete lesson:", error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center">Loading lesson...</div>
      </StudentLayout>
    );
  }

  if (!lesson) {
    return (
      <StudentLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Lesson not found</h1>
          {errorMessage && <p className="text-muted-foreground mb-4">{errorMessage}</p>}
          <Button onClick={() => navigate("/deshboardStudent")} className="rounded-2xl">
            Back to Dashboard
          </Button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activeItem="Home">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="secondary" className="rounded-full">
            Open learning
          </Badge>
          {lesson.courseId && (
            <Badge variant="outline" className="rounded-full">
              Course lesson
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{lesson.title}</h1>
        <p className="text-muted-foreground">
          {lesson.content || "Lesson content available below."}
        </p>
      </div>

      <Card className="rounded-2xl shadow-md mb-8">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            Lesson content
          </div>
          <p className="text-sm leading-6 text-foreground whitespace-pre-line">
            {lesson.content || "No written content for this lesson."}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {lesson.videoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-2xl gap-2"
                onClick={() => window.open(getResourceUrl(lesson.videoUrl), "_blank", "noopener,noreferrer")}
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
                onClick={() => window.open(getResourceUrl(lesson.pdfUrl), "_blank", "noopener,noreferrer")}
              >
                <FileText className="h-4 w-4" /> Open PDF
              </Button>
            )}
            {lesson.courseId && (
              <Button
                type="button"
                size="sm"
                className="rounded-2xl"
                onClick={() => navigate(`/course/${lesson.courseId}?lesson=${lesson.id}`)}
              >
                Open Course
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="rounded-2xl"
              onClick={handleComplete}
              disabled={completing || completed}
            >
              {completing ? "Saving..." : completed ? "Completed" : "Mark Complete"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {quizzes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Quizzes
            <Badge variant="secondary" className="rounded-full ml-auto">
              {quizzes.length}
            </Badge>
          </h2>
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-foreground">{quiz.title}</h3>
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
            ))}
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default LessonDetail;
