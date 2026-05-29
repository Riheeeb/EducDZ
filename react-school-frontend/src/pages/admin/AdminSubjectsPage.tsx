import { useState, useEffect, useCallback } from "react";
import SubjectForm from "@/components/admin/SubjectForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";
import { adminApi } from "@/services/adminApi";
import { toast } from "@/hooks/use-toast";

// matches the backend subjects entity
interface Subject {
  id:   string;
  name: string;
}

const AdminSubjectsPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Subject | null>(null);

  const loadSubjects = useCallback(() => {
    setLoading(true);
    adminApi
      .getSubjects()
      .then((data) => {
        setSubjects(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(() => {
        setSubjects([]);
        setError("Failed to load subjects from server");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleCreate = async (data: { name: string }) => {
    try {
      await adminApi.createSubject({ name: data.name });
      toast({ title: "Subject created" });
      setCreateOpen(false);
      loadSubjects();
    } catch {
      toast({ title: "Failed to create subject", variant: "destructive" });
    }
  };

  const handleRename = async (data: { name: string }) => {
    if (!renameTarget) return;
    try {
      await adminApi.renameSubject(renameTarget.id, data.name);
      toast({ title: "Subject renamed" });
      loadSubjects();
    } catch {
      toast({ title: "Failed to rename subject", variant: "destructive" });
    }
    setRenameTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Subjects</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Subject
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error   && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.length === 0 && (
            <p className="text-muted-foreground col-span-full">No subjects found.</p>
          )}
          {subjects.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRenameTarget(s)}
                >
                  <Pencil className="h-3 w-3 mr-1" /> Rename
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create form */}
      <SubjectForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Rename form */}
      {renameTarget && (
        <SubjectForm
          open={!!renameTarget}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          onSubmit={handleRename}
          initialName={renameTarget.name}
          mode="rename"
        />
      )}
    </div>
  );
};

export default AdminSubjectsPage;
