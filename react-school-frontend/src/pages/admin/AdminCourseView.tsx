import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCourseById, getLessonsByCourse, type Course, type Lesson } from "@/services/CourseService";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, Video } from "lucide-react";

const AdminCourseView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getCourseById(Number(id)).catch(() => null),
      getLessonsByCourse(Number(id)).catch(() => [] as Lesson[]),
    ])
      .then(([courseData, lessonsData]) => {
        if (!courseData) {
          setError("Course not found");
          return;
        }
        setCourse(courseData);
        setLessons(lessonsData);
      })
      .catch(() => setError("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedLesson = selectedLessonId != null
    ? lessons.find((l) => l.id === selectedLessonId) ?? null
    : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin/courses")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
        </Button>
        <p className="text-destructive">{error ?? "Course not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/admin/courses")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
        {course.teacherName && (
          <p className="text-sm text-muted-foreground mt-1">By {course.teacherName}</p>
        )}
      </div>

      <p className="text-muted-foreground">{course.description}</p>

      <div className="flex flex-wrap gap-2">
        {course.subject && <Badge variant="secondary">{course.subject}</Badge>}
        {course.stream && <Badge variant="outline">{course.stream}</Badge>}
        {course.year && <Badge variant="outline">{course.year}</Badge>}
        {course.substream && <Badge variant="outline">{course.substream}</Badge>}
      </div>

      {/* Selected lesson detail */}
      {selectedLesson && (
        <Card className="rounded-xl border-teal-200 bg-teal-50/60">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{selectedLesson.title}</h3>
                  {selectedLesson.videoUrl && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Video className="h-3 w-3" /> {selectedLesson.videoUrl}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLessonId(null)}
                className="shrink-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            <div className="prose prose-sm max-w-none text-foreground">
              {selectedLesson.content?.split("\n").map((line, i) => (
                <p key={i} className="mb-2">{line || "\u00A0"}</p>
              )) || <p className="text-muted-foreground italic">No content for this lesson.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Lessons ({lessons.length})
        </h2>
        {lessons.length === 0 ? (
          <p className="text-muted-foreground">No lessons in this course.</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <Card
                key={lesson.id}
                className={`rounded-xl cursor-pointer hover:shadow-md transition-shadow ${
                  selectedLessonId === lesson.id ? "ring-2 ring-teal-400 border-teal-300" : ""
                }`}
                onClick={() => setSelectedLessonId(lesson.id)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-foreground">
                        {index + 1}. {lesson.title}
                      </h3>
                      {selectedLessonId === lesson.id ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-teal-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {lesson.content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lesson.content}</p>
                    )}
                    {lesson.videoUrl && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Video className="h-3 w-3" /> {lesson.videoUrl}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseView;
