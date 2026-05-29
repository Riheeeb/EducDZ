import { useState, useEffect, useCallback } from "react";
import DataTable, { Column } from "@/components/admin/DataTable";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/services/adminApi";
import { Trash2, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// matches the backend Courses entity structure
interface Teacher {
  id:   number;
  userT: { name: string } | null;
}

interface Course {
  id:        string;
  title:     string;
  published: boolean;
  createdAt: string;
  teacher:   Teacher | null;      // backend Courses entity has teacher object
  studentLevel: string | null;    // MIDDLE_SCHOOL | HIGH_SCHOOL
}

const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "unpublish";
    course: Course;
  } | null>(null);

  const loadCourses = useCallback(() => {
    setLoading(true);
    adminApi
      .getCourses(page, 10)
      .then((data: any) => {
        // backend returns a Page object
        const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        setCourses(list);
        setTotalPages(data?.totalPages ?? 1);
        setError(null);
      })
      .catch(() => {
        setCourses([]);
        setError("Failed to load courses from server");
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, course } = confirmAction;
    try {
      if (type === "delete") await adminApi.deleteCourse(course.id);
      else                   await adminApi.unpublishCourse(course.id);
      toast({ title: `Course ${type === "delete" ? "deleted" : "unpublished"}` });
      loadCourses();
    } catch {
      toast({
        title: "Action failed",
        description: "Could not reach the server",
        variant: "destructive",
      });
    }
    setConfirmAction(null);
  };

  const columns: Column<Course>[] = [
    {
      key: "title",
      header: "Title",
      render: (c) => (
        <button
          onClick={() => navigate(`/admin/courses/${c.id}`)}
          className="text-left font-medium text-primary hover:underline cursor-pointer"
        >
          {c.title}
        </button>
      ),
    },
    {
      key: "teacher",
      header: "Teacher",
      // teacher is an object — extract the name from userT
      render: (c) => (
        <span>{c.teacher?.userT?.name ?? "—"}</span>
      ),
    },
    {
      key: "studentLevel",
      header: "Level",
      render: (c) => (
        <span className="text-sm text-muted-foreground">
          {c.studentLevel?.replace("_", " ") ?? "—"}
        </span>
      ),
    },
    {
      key: "published",
      header: "Status",
      render: (c) => (
        <Badge variant={c.published ? "default" : "secondary"}>
          {c.published ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (c) => (
        <span className="text-sm text-muted-foreground">
          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <div className="flex gap-1">
          {/* only show Unpublish button if course is published */}
          {c.published && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmAction({ type: "unpublish", course: c })}
            >
              <EyeOff className="h-3 w-3 mr-1" /> Unpublish
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirmAction({ type: "delete", course: c })}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Courses</h2>
      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error   && <p className="text-destructive">{error}</p>}
      {!loading && !error && (
        <DataTable
          columns={columns}
          data={courses}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          keyExtractor={(c) => c.id}
        />
      )}
      <ConfirmModal
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === "delete" ? "Delete Course" : "Unpublish Course"
        }
        description={`Are you sure you want to ${confirmAction?.type} "${confirmAction?.course.title}"?`}
        confirmLabel={confirmAction?.type === "delete" ? "Delete" : "Unpublish"}
        variant="destructive"
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default AdminCoursesPage;
