import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/services/adminApi";

interface StreamFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; year: { id: number } }) => void;
}

interface YearOption {
  id: number;
  year: string;
  label?: string;
}

const StreamForm = ({ open, onOpenChange, onSubmit }: StreamFormProps) => {
  const [name, setName] = useState("");
  const [yearId, setYearId] = useState("");
  const [years, setYears] = useState<YearOption[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingYears(true);
    adminApi
      .getYears()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setYears(list);
      })
      .catch(() => setYears([]))
      .finally(() => setLoadingYears(false));
  }, [open]);

  const handleSubmit = () => {
    if (!name.trim() || !yearId) return;
    onSubmit({ name: name.trim(), year: { id: Number(yearId) } });
    onOpenChange(false);
    setName("");
    setYearId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Stream</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Stream Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Science" />
          </div>
          <div>
            <Label>Year *</Label>
            {loadingYears ? (
              <p className="text-sm text-muted-foreground">Loading years...</p>
            ) : (
              <select
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a year</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label ?? y.year}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !yearId}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StreamForm;
