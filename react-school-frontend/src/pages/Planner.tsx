import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, Calendar, CheckCircle2, Clock, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUser } from "@/services/authStorage";
import {
  getPlannerData,
  createPlannerScheduleEntry,
  updatePlannerScheduleEntry,
  deletePlannerScheduleEntry,
  createPlannerExam,
  deletePlannerExam,
  createPlannerSession,
  updatePlannerSession,
  updatePlannerSessionCompletion,
  deletePlannerSession,
  type PlannerScheduleEntry,
  type PlannerExamEntry,
  type PlannerSessionEntry,
} from "@/services/plannerService";
import StudentLayout from "@/components/StudentLayout";

// ============================================================================
// TYPES
// ============================================================================

type TabType = "schedule" | "exams" | "sessions";

interface FormState {
  subject: string;
  day: string;
  timeFrom: string;
  timeTo: string;
  topic: string;
  date: string;
  chapters: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const EMPTY_FORM: FormState = {
  subject: "",
  day: "Monday",
  timeFrom: "08:00",
  timeTo: "09:00",
  topic: "",
  date: "",
  chapters: "",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Planner = () => {
  const navigate = useNavigate();
  const user = getUser();
  const studentId = Number(user?.userId ?? 0);

  // ========================================================================
  // STATE
  // ========================================================================

  const [schedules, setSchedules] = useState<PlannerScheduleEntry[]>([]);
  const [exams, setExams] = useState<PlannerExamEntry[]>([]);
  const [sessions, setSessions] = useState<PlannerSessionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("schedule");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (!studentId) {
      navigate("/login");
      return;
    }
    loadData();
  }, [navigate, studentId]);

  // ========================================================================
  // DATA LOADING
  // ========================================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlannerData(studentId);
      setSchedules(data.schedule);
      setExams(data.exams);
      setSessions(data.autoPlan);
    } catch (err) {
      console.error("Failed to load planner:", err);
      setError("Failed to load planner data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // SCHEDULE HANDLERS
  // ========================================================================

  const handleAddSchedule = async () => {
    if (!formData.subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    try {
      setError(null);

      if (editingId) {
        const updated = await updatePlannerScheduleEntry(studentId, editingId, {
          day: formData.day,
          time: `${formData.timeFrom}-${formData.timeTo}`,
          subject: formData.subject,
          topic: formData.topic,
        });
        setSchedules(schedules.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const newSchedule = await createPlannerScheduleEntry(studentId, {
          day: formData.day,
          time: `${formData.timeFrom}-${formData.timeTo}`,
          subject: formData.subject,
          topic: formData.topic,
        });
        setSchedules([...schedules, newSchedule]);
      }

      closeDialog();
    } catch (err) {
      console.error("Failed to save schedule:", err);
      setError("Failed to save schedule. Please try again.");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      setError(null);
      await deletePlannerScheduleEntry(studentId, id);
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      setError("Failed to delete schedule. Please try again.");
    }
  };

  const handleEditSchedule = (schedule: PlannerScheduleEntry) => {
    const [timeFrom, timeTo] = schedule.time.includes("-")
      ? schedule.time.split("-")
      : [schedule.time, "09:00"];

    setFormData({
      subject: schedule.subject,
      day: schedule.day,
      timeFrom: timeFrom.trim(),
      timeTo: timeTo.trim(),
      topic: schedule.topic,
      date: "",
      chapters: "",
    });
    setEditingId(schedule.id);
    setActiveTab("schedule");
    setShowDialog(true);
  };

  // ========================================================================
  // EXAM HANDLERS
  // ========================================================================

  const handleAddExam = async () => {
    if (!formData.subject.trim() || !formData.date) {
      setError("Please enter subject and date");
      return;
    }

    try {
      setError(null);

      if (editingId) {
        await deletePlannerExam(studentId, editingId);
        const newExam = await createPlannerExam(studentId, {
          subject: formData.subject,
          date: formData.date,
          chapters: formData.chapters,
        });
        setExams([...exams.filter((e) => e.id !== editingId), newExam]);
      } else {
        const newExam = await createPlannerExam(studentId, {
          subject: formData.subject,
          date: formData.date,
          chapters: formData.chapters,
        });
        setExams([...exams, newExam]);
      }

      closeDialog();
    } catch (err) {
      console.error("Failed to save exam:", err);
      setError("Failed to save exam. Please try again.");
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      setError(null);
      await deletePlannerExam(studentId, id);
      setExams(exams.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete exam:", err);
      setError("Failed to delete exam. Please try again.");
    }
  };

  const handleEditExam = (exam: PlannerExamEntry) => {
    setFormData({
      subject: exam.subject,
      day: "Monday",
      time: "08:00",
      topic: "",
      date: exam.date,
      chapters: exam.chapters,
    });
    setEditingId(exam.id);
    setActiveTab("exams");
    setShowDialog(true);
  };

  // ========================================================================
  // SESSION HANDLERS
  // ========================================================================

  const handleAddSession = async () => {
    if (!formData.subject.trim() || !formData.timeFrom) {
      setError("Please enter subject and time");
      return;
    }

    try {
      setError(null);

      if (editingId) {
        const updated = await updatePlannerSession(studentId, editingId, {
          day: formData.day,
          time: `${formData.timeFrom}-${formData.timeTo}`,
          subject: formData.subject,
          topic: formData.topic,
          completed: false,
        });
        setSessions(sessions.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const newSession = await createPlannerSession(studentId, {
          day: formData.day,
          time: `${formData.timeFrom}-${formData.timeTo}`,
          subject: formData.subject,
          topic: formData.topic,
          completed: false,
        });
        setSessions([...sessions, newSession]);
      }

      closeDialog();
    } catch (err) {
      console.error("Failed to save session:", err);
      setError("Failed to save session. Please try again.");
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      setError(null);
      await deletePlannerSession(studentId, id);
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete session:", err);
      setError("Failed to delete session. Please try again.");
    }
  };

  const handleEditSession = (session: PlannerSessionEntry) => {
    const [timeFrom, timeTo] = session.time.includes("-")
      ? session.time.split("-")
      : [session.time, "09:00"];

    setFormData({
      subject: session.subject,
      day: session.day,
      timeFrom: timeFrom.trim(),
      timeTo: timeTo.trim(),
      topic: session.topic,
      date: "",
      chapters: "",
    });
    setEditingId(session.id);
    setActiveTab("sessions");
    setShowDialog(true);
  };

  const handleToggleSession = async (id: string, currentStatus: boolean) => {
    try {
      setError(null);
      const updated = await updatePlannerSessionCompletion(
        studentId,
        id,
        !currentStatus
      );
      setSessions(sessions.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error("Failed to update session:", err);
      setError("Failed to update session. Please try again.");
    }
  };

  // ========================================================================
  // DIALOG HANDLERS
  // ========================================================================

  const openDialog = () => {
    setError(null);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleFormChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (activeTab === "schedule") {
      handleAddSchedule();
    } else if (activeTab === "exams") {
      handleAddExam();
    } else {
      handleAddSession();
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading) {
    return (
      <StudentLayout activeItem="Planner">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading planner...</p>
        </div>
      </StudentLayout>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <StudentLayout activeItem="Planner">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Study Planner</h1>
            <p className="text-muted-foreground">
              Organize your schedule, exams, and study sessions
            </p>
          </div>
          <Button onClick={openDialog} className="rounded-2xl gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* Tabs */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        {activeTab === "schedule" && (
          <ScheduleTab
            items={schedules}
            onAdd={openDialog}
            onEdit={handleEditSchedule}
            onDelete={handleDeleteSchedule}
          />
        )}

        {activeTab === "exams" && (
          <ExamsTab
            items={exams}
            onAdd={openDialog}
            onEdit={handleEditExam}
            onDelete={handleDeleteExam}
          />
        )}

        {activeTab === "sessions" && (
          <SessionsTab
            items={sessions}
            onAdd={openDialog}
            onEdit={handleEditSession}
            onDelete={handleDeleteSession}
            onToggleCompletion={handleToggleSession}
          />
        )}
      </div>

      {/* Dialog */}
      <FormDialog
        open={showDialog}
        activeTab={activeTab}
        isEditing={editingId !== null}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        onClose={closeDialog}
      />
    </StudentLayout>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Error Alert
interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

const ErrorAlert = ({ message, onClose }: ErrorAlertProps) => (
  <Card className="rounded-2xl shadow-md border-red-200 bg-red-50">
    <CardContent className="p-4 flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
      <p className="text-sm text-red-700 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-red-600 hover:text-red-700 shrink-0"
        title="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </CardContent>
  </Card>
);

// Tab Navigation
interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => (
  <div className="flex gap-2 border-b border-border">
    {[
      { id: "schedule" as const, label: "Schedule", icon: "📅" },
      { id: "exams" as const, label: "Exams", icon: "📚" },
      { id: "sessions" as const, label: "Study Sessions", icon: "⏰" },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
          activeTab === tab.id
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>{tab.icon}</span>
        {tab.label}
      </button>
    ))}
  </div>
);

// Empty State
interface EmptyStateProps {
  title: string;
  icon: React.ReactNode;
  onAdd: () => void;
}

const EmptyState = ({ title, icon, onAdd }: EmptyStateProps) => (
  <Card className="rounded-2xl shadow-md">
    <CardContent className="p-12 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <p className="text-foreground font-medium mb-4">{title}</p>
      <Button onClick={onAdd} className="rounded-2xl">
        Add Now
      </Button>
    </CardContent>
  </Card>
);

// Schedule Tab
interface ScheduleTabProps {
  items: PlannerScheduleEntry[];
  onAdd: () => void;
  onEdit: (item: PlannerScheduleEntry) => void;
  onDelete: (id: string) => void;
}

const ScheduleTab = ({ items, onAdd, onEdit, onDelete }: ScheduleTabProps) => (
  <div className="space-y-4">
    {items.length === 0 ? (
      <EmptyState
        title="No schedules yet"
        icon={<Calendar className="h-12 w-12 text-muted-foreground opacity-50" />}
        onAdd={onAdd}
      />
    ) : (
      items.map((item) => (
        <ScheduleCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))
    )}
  </div>
);

// Schedule Card
interface ScheduleCardProps {
  item: PlannerScheduleEntry;
  onEdit: (item: PlannerScheduleEntry) => void;
  onDelete: (id: string) => void;
}

const ScheduleCard = ({ item, onEdit, onDelete }: ScheduleCardProps) => (
  <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg">{item.subject}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {item.day} • {item.time}
          </p>
          {item.topic && (
            <p className="text-sm text-muted-foreground mt-2">📌 {item.topic}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="rounded-lg text-xs"
          >
            Edit
          </Button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Delete"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Exams Tab
interface ExamsTabProps {
  items: PlannerExamEntry[];
  onAdd: () => void;
  onEdit: (item: PlannerExamEntry) => void;
  onDelete: (id: string) => void;
}

const ExamsTab = ({ items, onAdd, onEdit, onDelete }: ExamsTabProps) => (
  <div className="space-y-4">
    {items.length === 0 ? (
      <EmptyState
        title="No exams scheduled"
        icon={<BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />}
        onAdd={onAdd}
      />
    ) : (
      items.map((item) => (
        <ExamCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))
    )}
  </div>
);

// Exam Card
interface ExamCardProps {
  item: PlannerExamEntry;
  onEdit: (item: PlannerExamEntry) => void;
  onDelete: (id: string) => void;
}

const ExamCard = ({ item, onEdit, onDelete }: ExamCardProps) => (
  <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg">{item.subject}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(item.date).toLocaleDateString()}
          </p>
          {item.chapters && (
            <p className="text-sm text-muted-foreground mt-2">
              📖 Chapters: {item.chapters}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="rounded-lg text-xs"
          >
            Edit
          </Button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Delete"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Sessions Tab
interface SessionsTabProps {
  items: PlannerSessionEntry[];
  onAdd: () => void;
  onEdit: (item: PlannerSessionEntry) => void;
  onDelete: (id: string) => void;
  onToggleCompletion: (id: string, currentStatus: boolean) => void;
}

const SessionsTab = ({
  items,
  onAdd,
  onEdit,
  onDelete,
  onToggleCompletion,
}: SessionsTabProps) => (
  <div className="space-y-4">
    {items.length === 0 ? (
      <EmptyState
        title="No study sessions yet"
        icon={<Clock className="h-12 w-12 text-muted-foreground opacity-50" />}
        onAdd={onAdd}
      />
    ) : (
      items.map((item) => (
        <SessionCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleCompletion={onToggleCompletion}
        />
      ))
    )}
  </div>
);

// Session Card
interface SessionCardProps {
  item: PlannerSessionEntry;
  onEdit: (item: PlannerSessionEntry) => void;
  onDelete: (id: string) => void;
  onToggleCompletion: (id: string, currentStatus: boolean) => void;
}

const SessionCard = ({
  item,
  onEdit,
  onDelete,
  onToggleCompletion,
}: SessionCardProps) => (
  <Card
    className={`rounded-2xl shadow-sm transition-all hover:shadow-md ${
      item.completed ? "opacity-60" : ""
    }`}
  >
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggleCompletion(item.id, item.completed)}
          className="mt-1 shrink-0"
          title="Toggle completion"
        >
          <CheckCircle2
            className={`h-6 w-6 transition-colors ${
              item.completed ? "text-green-600 fill-green-600" : "text-gray-300"
            }`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-foreground ${
              item.completed ? "line-through opacity-50" : ""
            }`}
          >
            {item.subject}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {item.day} • {item.time}
          </p>
          {item.topic && (
            <p className="text-sm text-muted-foreground mt-1">📌 {item.topic}</p>
          )}
          {item.generated && (
            <Badge className="mt-2 rounded-full bg-blue-600 text-white text-xs">
              Auto-generated
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="rounded-lg text-xs"
          >
            Edit
          </Button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Delete"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Form Dialog
interface FormDialogProps {
  open: boolean;
  activeTab: TabType;
  isEditing: boolean;
  formData: FormState;
  onFormChange: (field: keyof FormState, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const FormDialog = ({
  open,
  activeTab,
  isEditing,
  formData,
  onFormChange,
  onSubmit,
  onClose,
}: FormDialogProps) => {
  const getTitle = () => {
    const action = isEditing ? "Edit" : "Add";
    if (activeTab === "schedule") return `${action} Schedule`;
    if (activeTab === "exams") return `${action} Exam`;
    return `${action} Study Session`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {activeTab === "schedule" && (
            <ScheduleForm formData={formData} onFormChange={onFormChange} />
          )}

          {activeTab === "exams" && (
            <ExamForm formData={formData} onFormChange={onFormChange} />
          )}

          {activeTab === "sessions" && (
            <SessionForm formData={formData} onFormChange={onFormChange} />
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={onSubmit} className="flex-1 rounded-lg">
              {isEditing ? "Update" : "Add"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Form Components
interface FormComponentProps {
  formData: FormState;
  onFormChange: (field: keyof FormState, value: string) => void;
}

const ScheduleForm = ({ formData, onFormChange }: FormComponentProps) => (
  <>
    <FormInput
      label="Subject"
      placeholder="Subject"
      value={formData.subject}
      onChange={(value) => onFormChange("subject", value)}
    />

    <FormInput
      label="Topic (optional)"
      placeholder="Topic"
      value={formData.topic}
      onChange={(value) => onFormChange("topic", value)}
    />

    <div className="grid grid-cols-2 gap-4">
      <FormSelect
        label="Day"
        value={formData.day}
        options={DAYS_OF_WEEK}
        onChange={(value) => onFormChange("day", value)}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <FormInput
        label="From"
        type="time"
        value={formData.timeFrom}
        onChange={(value) => onFormChange("timeFrom", value)}
      />
      <FormInput
        label="To"
        type="time"
        value={formData.timeTo}
        onChange={(value) => onFormChange("timeTo", value)}
      />
    </div>
  </>
);

const ExamForm = ({ formData, onFormChange }: FormComponentProps) => (
  <>
    <FormInput
      label="Subject"
      placeholder="Subject"
      value={formData.subject}
      onChange={(value) => onFormChange("subject", value)}
    />

    <FormInput
      label="Exam Date"
      type="date"
      value={formData.date}
      onChange={(value) => onFormChange("date", value)}
    />

    <FormInput
      label="Chapters (optional)"
      placeholder="Chapters to study"
      value={formData.chapters}
      onChange={(value) => onFormChange("chapters", value)}
    />
  </>
);

const SessionForm = ({ formData, onFormChange }: FormComponentProps) => (
  <>
    <FormInput
      label="Subject"
      placeholder="Subject"
      value={formData.subject}
      onChange={(value) => onFormChange("subject", value)}
    />

    <FormInput
      label="Topic (optional)"
      placeholder="Topic"
      value={formData.topic}
      onChange={(value) => onFormChange("topic", value)}
    />

    <div className="grid grid-cols-2 gap-4">
      <FormSelect
        label="Day"
        value={formData.day}
        options={DAYS_OF_WEEK}
        onChange={(value) => onFormChange("day", value)}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <FormInput
        label="From"
        type="time"
        value={formData.timeFrom}
        onChange={(value) => onFormChange("timeFrom", value)}
      />
      <FormInput
        label="To"
        type="time"
        value={formData.timeTo}
        onChange={(value) => onFormChange("timeTo", value)}
      />
    </div>
  </>
);

// Input Components
interface FormInputProps {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}

const FormInput = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: FormInputProps) => (
  <div>
    <label className="block text-sm font-medium mb-2">{label}</label>
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg"
    />
  </div>
);

interface FormSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const FormSelect = ({ label, value, options, onChange }: FormSelectProps) => (
  <div>
    <label className="block text-sm font-medium mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default Planner;