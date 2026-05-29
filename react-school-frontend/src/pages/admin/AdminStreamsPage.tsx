import { useState, useEffect, useCallback } from "react";
import StreamForm from "@/components/admin/StreamForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { adminApi } from "@/services/adminApi";
import { toast } from "@/hooks/use-toast";

// matches the backend Streams entity
interface Stream {
  id:         string;
  streamType: { namestream: string } | null;  // stream type object with name
  year:       { label: string; yearNumber: number } | null; // year object
}

const AdminStreamsPage = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const loadStreams = useCallback(() => {
    setLoading(true);
    adminApi
      .getStreams()
      .then((data) => {
        setStreams(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(() => {
        setStreams([]);
        setError("Failed to load streams from server");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const handleCreate = async (data: { name: string; year: { id: number } }) => {
    try {
      await adminApi.createStream(data);
      toast({ title: "Stream created" });
      setFormOpen(false);
      loadStreams();
    } catch {
      toast({ title: "Failed to create stream", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Streams</h2>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Stream
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error   && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.length === 0 && (
            <p className="text-muted-foreground col-span-full">No streams found.</p>
          )}
          {streams.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {s.streamType?.namestream ?? "No type"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-muted-foreground">
                  {s.year?.label ?? "No year set"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StreamForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default AdminStreamsPage;
