import { useState, useEffect, useCallback } from "react";
import DataTable, { Column } from "@/components/admin/DataTable";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/services/adminApi";
import { Ban, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// matches the backend users entity fields
interface User {
  id:          string;
  name:        string;        // users.name
  email:       string;        // users.email
  accountType: string;        // users.accountType (STUDENT | TEACHER | ADMIN)
  enabled:     boolean;       // users.enabled  (true=active, false=banned)
  createdAt?:  string | null;
}

interface AdminUsersPageProps {
  filterRole?: "STUDENT" | "TEACHER";
}

const AdminUsersPage = ({ filterRole }: AdminUsersPageProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "ban" | "unban";
    user: User;
  } | null>(null);

  const loadUsers = useCallback(() => {
    setLoading(true);
    const fetcher =
      filterRole === "STUDENT"
        ? adminApi.getStudents
        : filterRole === "TEACHER"
        ? adminApi.getTeachers
        : adminApi.getUsers;

    fetcher(page, 10)
      .then((data: any) => {
        // backend returns a Page object with content array
        const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        setUsers(list);
        setTotalPages(data?.totalPages ?? 1);
        setError(null);
      })
      .catch(() => {
        setUsers([]);
        setError("Failed to load users from server");
      })
      .finally(() => setLoading(false));
  }, [page, filterRole]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, user } = confirmAction;
    try {
      if (type === "delete")      await adminApi.deleteUser(user.id);
      else if (type === "ban")    await adminApi.banUser(user.id);
      else                        await adminApi.unbanUser(user.id);

      toast({
        title: `User ${type === "delete" ? "deleted" : type === "ban" ? "banned" : "unbanned"}`,
      });
      loadUsers();
    } catch {
      toast({
        title: "Action failed",
        description: "Could not reach the server",
        variant: "destructive",
      });
    }
    setConfirmAction(null);
  };

  const columns: Column<User>[] = [
    { key: "name",  header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "accountType",
      header: "Role",
      render: (u) => (
        <Badge variant={u.accountType === "TEACHER" ? "default" : "secondary"}>
          {u.accountType}
        </Badge>
      ),
    },
    {
      key: "enabled",
      header: "Status",
      render: (u) => (
        <Badge variant={u.enabled ? "outline" : "destructive"}>
          {u.enabled ? "Active" : "Banned"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (u) => (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <div className="flex gap-1">
          {/* show Ban when active, Unban when banned */}
          {u.enabled ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmAction({ type: "ban", user: u })}
            >
              <Ban className="h-3 w-3 mr-1" /> Ban
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmAction({ type: "unban", user: u })}
            >
              <ShieldCheck className="h-3 w-3 mr-1" /> Unban
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirmAction({ type: "delete", user: u })}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  const title =
    filterRole === "STUDENT"
      ? "Students"
      : filterRole === "TEACHER"
      ? "Teachers"
      : "All Users";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error   && <p className="text-destructive">{error}</p>}
      {!loading && !error && (
        <DataTable
          columns={columns}
          data={users}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          keyExtractor={(u) => u.id}
        />
      )}
      <ConfirmModal
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === "delete"
            ? "Delete User"
            : confirmAction?.type === "ban"
            ? "Ban User"
            : "Unban User"
        }
        description={`Are you sure you want to ${confirmAction?.type} "${confirmAction?.user.name}"?`}
        confirmLabel={
          confirmAction?.type === "delete"
            ? "Delete"
            : confirmAction?.type === "ban"
            ? "Ban"
            : "Unban"
        }
        variant={confirmAction?.type === "unban" ? "default" : "destructive"}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default AdminUsersPage;
