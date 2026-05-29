import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  createTeacherCourse,
  updateTeacherCourse,
  getYearOptions,
  getStreamsByYear,
  getSubstreamsByStream,
  type TeacherCourse,
  type SubjectOption,
  type YearOption,
  type StreamOption,
  type SubstreamOption,
} from "@/services/teacherDashboardService";
 
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse: TeacherCourse | null;
  subjects: SubjectOption[];
  teacherId: number;
  teacherSubjectName: string;
  onSaved: () => Promise<void>;
}
 
const LEVELS = [
  { value: "MIDDLE_SCHOOL", label: "Middle School" },
  { value: "HIGH_SCHOOL",   label: "High School" },
];
 
const CourseDialog = ({
  open,
  onOpenChange,
  editingCourse,
  subjects,
  teacherId,
  teacherSubjectName,
  onSaved,
}: Props) => {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
 
  // form state
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel]           = useState("");
  const [yearId, setYearId]         = useState<number | null>(null);
  const [streamId, setStreamId]     = useState<number | null>(null);
  const [substreamId, setSubstreamId] = useState<number | null>(null);
 
  // dropdown data
  const [years, setYears]         = useState<YearOption[]>([]);
  const [streams, setStreams]     = useState<StreamOption[]>([]);
  const [substreams, setSubstreams] = useState<SubstreamOption[]>([]);
  const shouldShowStreams = level === "HIGH_SCHOOL";
 
  // populate form when editing
  useEffect(() => {
    if (!open) return;
    setError("");
    if (editingCourse) {
      setTitle(editingCourse.title);
      setDescription(editingCourse.description);
      setLevel(editingCourse.studentLevel);
      setYearId(editingCourse.yearId ?? null);
      setStreamId(editingCourse.streamId ?? null);
      setSubstreamId(editingCourse.substreamId ?? null);
    } else {
      setTitle("");
      setDescription("");
      setLevel("");
      setYearId(null);
      setStreamId(null);
      setSubstreamId(null);
      setStreams([]);
      setSubstreams([]);
    }
  }, [open, editingCourse]);
 
  // load years whenever open
 useEffect(() => {
  console.log("years loaded:", years);
  if (!open || !level) {
    setYears([]);
    return;
  }
  console.log("Loading years for level:", level);
  getYearOptions(level)   
    .then((data) => {
      console.log("Years loaded:", data);  // ← add
      setYears(data);
    })
      
    .catch(() => setYears([]));
}, [open, level]);
 
  // filter years by selected level
  
 
  // load streams when year changes
  useEffect(() => {
    if (!yearId || !shouldShowStreams) {
      setStreams([]);
      setStreamId(null);
      setSubstreams([]);
      setSubstreamId(null);
      return;
    }

    getStreamsByYear(yearId)
      .then(setStreams)
      .catch(() => setStreams([]));
  }, [yearId, shouldShowStreams]);
 
  // load substreams when stream changes
  useEffect(() => {
    if (!streamId || !shouldShowStreams) { setSubstreams([]); setSubstreamId(null); return; }
    getSubstreamsByStream( streamId)
      .then(setSubstreams)
      .catch(() => setSubstreams([]));
  }, [streamId, shouldShowStreams]);
 
  const handleSave = async () => {
     console.log("SAVE — level:", level, "yearId:", yearId, "streamId:", streamId);
    if (!title.trim())  { setError("Title is required."); return; }
    if (!level)         { setError("Level is required."); return; }
    if (!yearId)        { setError("Year is required."); return; }
 
    const teacherSubject = subjects.find(
    (s) => s.name.toLowerCase() === teacherSubjectName.toLowerCase()
  );

  console.log("teacherSubject found:", teacherSubject);
  console.log("all subjects:", subjects);
  console.log("looking for:", teacherSubjectName);
  if (!teacherSubject && !editingCourse) {
    setError("Could not find your subject. Please reload the page.");
    return;
  }
    setSaving(true);
    setError("");
    try {
      if (editingCourse) {
        await updateTeacherCourse(editingCourse.id, {
          title: title.trim(),
          description: description.trim(),
          studentLevel: level,
          yearId,
          streamId:    streamId    ?? undefined,
          substreamId: substreamId ?? undefined,
          subjectId: teacherSubject?.id,
        });
      } else {
       
 
        await createTeacherCourse({
          teacherId,
          title: title.trim(),
          description: description.trim(),
          studentLevel: level,
          yearId,
          streamId:    streamId    ?? undefined,
          substreamId: substreamId ?? undefined,
          subjectId: teacherSubject?.id,
        });
      }
      onOpenChange(false);
      await onSaved();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message ?? "Failed to save course.");
    } finally {
      setSaving(false);
    }
  };
 
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle>
        </DialogHeader>
 
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              placeholder="Course title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl"
            />
          </div>
 
          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-2xl"
            />
          </div>
 
          {/* Level */}
          <div className="space-y-1">
            <Label>Level</Label>
            <Select
              value={level}
              onValueChange={(v) => {
                setLevel(v);
                setYearId(null);
                setStreamId(null);
                setSubstreamId(null);
                setStreams([]);
                setSubstreams([]);
              }}
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Choose level" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
          {/* Year — depends on level */}
          {level && (
            <div className="space-y-1">
              <Label>Year</Label>
              <Select
                value={yearId ? String(yearId) : ""}
                onValueChange={(v) => {
                  console.log("YEAR SELECTED:", v);
                  setYearId(Number(v));
                  setStreamId(null);
                  setSubstreamId(null);
                  setSubstreams([]);
                }}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Choose year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
  <SelectItem key={y.id} value={String(y.id)}>{y.label}</SelectItem>
))}
                </SelectContent>
              </Select>
            </div>
          )}
 
          {/* Stream — depends on year, only shown if streams exist */}
          {shouldShowStreams && yearId && streams.length > 0 && (
            <div className="space-y-1">
              <Label>Stream</Label>
              <Select
                value={streamId ? String(streamId) : ""}
                onValueChange={(v) => {
                  setStreamId(Number(v));
                  setSubstreamId(null);
                }}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Choose stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.namestream}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
 
          {/* Substream — depends on stream, only shown if substreams exist */}
          {shouldShowStreams && streamId && substreams.length > 0 && (
            <div className="space-y-1">
              <Label>Sub Stream</Label>
              <Select
                value={substreamId ? String(substreamId) : ""}
                onValueChange={(v) => setSubstreamId(Number(v))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Choose sub stream" />
                </SelectTrigger>
                <SelectContent>
                  {substreams.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nameSubstream}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
 
          {!editingCourse && (
            <p className="text-xs text-muted-foreground">
              Subject is taken from your teacher account.
            </p>
          )}
 
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
 
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="rounded-2xl" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
 
export default CourseDialog;
