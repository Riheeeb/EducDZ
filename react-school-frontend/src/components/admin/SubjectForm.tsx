import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SubjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string }) => void;
  initialName?: string;
  mode: "create" | "rename";
}

const SubjectForm = ({ open, onOpenChange, onSubmit, initialName, mode }: SubjectFormProps) => {
  const [name, setName] = useState(initialName ?? "");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
    onOpenChange(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Subject" : "Rename Subject"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Subject Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{mode === "create" ? "Create" : "Rename"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectForm;