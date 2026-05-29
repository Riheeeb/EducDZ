import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BadgeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BadgeFormData) => void;
  initialData?: BadgeFormData;
}

export interface BadgeFormData {
  name: string;
  description: string;
  iconUrl: string;
  tier: string;
  bonusPoints: number;
  triggerType: string;
}

const tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
const triggers = [
  "FIRST_LESSON", "COURSE_COMPLETE", "QUIZ_PERFECT", "QUIZ_PASS",
  "STREAK_7_DAYS", "POINTS_MILESTONE", "FAST_LEARNER", "TOP_STUDENT",
  "COMEBACK", "NEVER_GIVE_UP",
];

const BadgeForm = ({ open, onOpenChange, onSubmit, initialData }: BadgeFormProps) => {
  const [form, setForm] = useState<BadgeFormData>(
    initialData ?? { name: "", description: "", iconUrl: "", tier: "BRONZE", bonusPoints: 10, triggerType: "FIRST_LESSON" }
  );

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSubmit(form);
    onOpenChange(false);
    if (!initialData) setForm({ name: "", description: "", iconUrl: "", tier: "BRONZE", bonusPoints: 10, triggerType: "FIRST_LESSON" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Badge" : "Create Badge"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Badge name" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What earns this badge?" />
          </div>
          <div>
            <Label>Icon URL</Label>
            <Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bonus Points</Label>
              <Input type="number" value={form.bonusPoints} onChange={(e) => setForm({ ...form, bonusPoints: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Trigger Type</Label>
            <Select value={form.triggerType} onValueChange={(v) => setForm({ ...form, triggerType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {triggers.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{initialData ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeForm;
