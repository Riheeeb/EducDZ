import { useState, useEffect, useCallback } from "react";
import DataTable, { Column } from "@/components/admin/DataTable";
import ConfirmModal from "@/components/admin/ConfirmModal";
import BadgeForm, { BadgeFormData } from "@/components/admin/BadgeForm";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/services/adminApi";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// matches the backend Badges entity fields
interface BadgeItem {
  id:          string;
  code:        string;        // unique code e.g. "FIRST_LESSON"
  name:        string;
  description: string;
  iconUrl:     string;
  tier:        string;        // BRONZE | SILVER | GOLD | PLATINUM
  trigger:     string;        // BadgeTrigger enum value
  bonusPoints: number;
  pointsThreshold: number | null; // only for POINTS_MILESTONE trigger
}

const tierColors: Record<string, string> = {
  BRONZE:   "bg-amber-700/10 text-amber-700",
  SILVER:   "bg-slate-400/10 text-slate-500",
  GOLD:     "bg-yellow-500/10 text-yellow-600",
  PLATINUM: "bg-purple-500/10 text-purple-600",
};

const AdminBadgesPage = () => {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editBadge, setEditBadge] = useState<BadgeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BadgeItem | null>(null);

  const loadBadges = useCallback(() => {
    setLoading(true);
    adminApi
      .getBadges()
      .then((data) => {
        setBadges(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(() => {
        setBadges([]);
        setError("Failed to load badges from server");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const handleCreate = async (data: BadgeFormData) => {
    try {
      await adminApi.createBadge(data);
      toast({ title: "Badge created" });
      setFormOpen(false);
      loadBadges();
    } catch {
      toast({ title: "Failed to create badge", variant: "destructive" });
    }
  };

  const handleEdit = async (data: BadgeFormData) => {
    if (!editBadge) return;
    try {
      await adminApi.updateBadge(editBadge.id, data);
      toast({ title: "Badge updated" });
      loadBadges();
    } catch {
      toast({ title: "Failed to update badge", variant: "destructive" });
    }
    setEditBadge(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteBadge(deleteTarget.id);
      toast({ title: "Badge deleted" });
      loadBadges();
    } catch {
      toast({ title: "Failed to delete badge", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const columns: Column<BadgeItem>[] = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    {
      key: "tier",
      header: "Tier",
      render: (b) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[b.tier] ?? ""}`}>
          {b.tier}
        </span>
      ),
    },
    {
      key: "trigger",
      header: "Trigger",
      // replace underscores with spaces for readability
      render: (b) => (
        <span className="text-sm">{b.trigger.replace(/_/g, " ")}</span>
      ),
    },
    { key: "bonusPoints", header: "Bonus pts" },
    {
      key: "actions",
      header: "Actions",
      render: (b) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setEditBadge(b)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(b)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Badges</h2>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Badge
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error   && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <DataTable
          columns={columns}
          data={badges}
          page={0}
          totalPages={1}
          onPageChange={() => {}}
          keyExtractor={(b) => b.id}
        />
      )}

      {/* Create form */}
      <BadgeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      {/* Edit form */}
      {editBadge && (
        <BadgeForm
          open={!!editBadge}
          onOpenChange={(open) => !open && setEditBadge(null)}
          onSubmit={handleEdit}
          initialData={editBadge}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Badge"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminBadgesPage;
