import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  ClipboardList,
  Flame,
  Lock,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getUser } from "@/services/authStorage";
import {
  getStudentBadgePage,
  type StudentBadge,
  type StudentBadgePage,
} from "@/services/badgeService";
import { getStudyLevel, tierColors } from "@/lib/studyLevels";
import StudentLayout from "@/components/StudentLayout";
import api from "@/services/api";

// ── helpers ────────────────────────────────────────────────────────────────

const deriveTotalPoints = (badges: StudentBadge[], serverTotal: number): number => {
  const earned = badges.filter((b) => b.earned);
  if (earned.length === 0) return serverTotal;
  const sum = earned.reduce((acc, b) => acc + (b.bonusPoints ?? 0), 0);
  return Math.max(sum, serverTotal);
};

const emptyBadgePage: StudentBadgePage = { totalPoints: 0, badges: [] };

const tierGlow: Record<string, string> = {
  BRONZE:   "shadow-orange-300",
  SILVER:   "shadow-gray-300",
  GOLD:     "shadow-yellow-300",
  PLATINUM: "shadow-cyan-300",
};

// Maps each trigger code to a readable label and description shown on the locked card
const TRIGGER_INFO: Record<string, { label: string; hint: string }> = {
  FIRST_LESSON:    { label: "First Step",       hint: "Complete your first lesson"                        },
  COURSE_COMPLETE: { label: "Course Finisher",   hint: "Finish any course"                                },
  FAST_LEARNER:    { label: "Fast Learner",      hint: "Finish a course in under 3 days"                  },
  COURSE_MASTER:   { label: "Course Master",     hint: "Complete 10 different courses"                    },
  QUIZ_PASS:       { label: "Quiz Passer",       hint: "Pass your first quiz"                             },
  QUIZ_PERFECT:    { label: "Perfect Score",     hint: "Score 100% on any quiz"                           },
  QUIZ_MASTER:     { label: "Quiz Master",       hint: "Score 100% on 10 quizzes — first attempt each"   },
  POINTS_MILESTONE:{ label: "Points Milestone",  hint: "Reach a points threshold"                         },
  STREAK_7_DAYS:   { label: "7-Day Streak",      hint: "Study 7 days in a row"                            },
  TOP_STUDENT:     { label: "Top Student",       hint: "Rank #1 in a course"                              },
  COMEBACK:        { label: "Comeback Kid",      hint: "Return after 30 days of inactivity"               },
  NEVER_GIVE_UP:   { label: "Never Give Up",     hint: "Re-enroll in a dropped course 3+ times"           },
};

// ── sub-components ─────────────────────────────────────────────────────────

const BadgeIcon = ({ badge, locked = false }: { badge: StudentBadge; locked?: boolean }) => {
  if (badge.iconUrl) {
    return (
      <img
        src={badge.iconUrl}
        alt={badge.name}
        className={`h-12 w-12 object-contain mx-auto mb-2 ${locked ? "grayscale opacity-40" : ""}`}
      />
    );
  }
  return (
    <Award
      className="h-10 w-10 mx-auto mb-2"
      style={{ color: locked ? "#9ca3af" : tierColors[badge.tier] }}
    />
  );
};

// Progress bar card — shown for milestone badges that have a trackable counter
const MilestoneProgressCard = ({
  icon,
  label,
  description,
  current,
  target,
  textColor,
  bgColor,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  current: number;
  target: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
}) => {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${borderColor}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
          <span className={textColor}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className={`text-xs font-bold shrink-0 ${textColor}`}>
          {current}/{target}
        </span>
      </div>
      <Progress value={pct} className="h-1.5 rounded-full" />
    </div>
  );
};

// ── component ──────────────────────────────────────────────────────────────

const StudentBadges = () => {
  const navigate  = useNavigate();
  const user      = getUser();
  const studentId = Number(user?.userId ?? 0);

  const [badgePage, setBadgePage]         = useState<StudentBadgePage>(emptyBadgePage);
  const [totalPoints, setTotalPoints]     = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<StudentBadge | null>(null);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  // Counters for milestone progress bars
  const [completedCourses, setCompletedCourses]         = useState(0);
  const [perfectFirstAttempts, setPerfectFirstAttempts] = useState(0);
  const [currentStreak, setCurrentStreak]               = useState(0);

  // ── data loader ─────────────────────────────────────────────────────────
  const loadData = useCallback(
    async (silent = false) => {
      if (!studentId) { navigate("/login"); return; }
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const [badgeResult, enrollResult, perfectResult, streakResult] =
          await Promise.allSettled([
            getStudentBadgePage(studentId),
            api.get(`/students/${studentId}/enrollments`),
            api.get(`/students/${studentId}/quiz-perfect-first-attempts`),
            api.get(`/students/${studentId}/streak`),
          ]);

        if (badgeResult.status === "fulfilled") {
          const data = badgeResult.value;
          const correctedTotal = deriveTotalPoints(data.badges, data.totalPoints);
          setBadgePage({ ...data, totalPoints: correctedTotal });
          setTotalPoints(correctedTotal);
        }

        if (enrollResult.status === "fulfilled") {
          const list = Array.isArray(enrollResult.value.data) ? enrollResult.value.data : [];
          setCompletedCourses(list.filter((e: any) => e.status === "COMPLETED").length);
        }

        if (perfectResult.status === "fulfilled") {
          setPerfectFirstAttempts(Number(perfectResult.value.data ?? 0));
        }

        if (streakResult.status === "fulfilled") {
          setCurrentStreak(Number(streakResult.value.data ?? 0));
        }
      } catch (err) {
        console.error("Error loading badges:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [studentId, navigate]
  );

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handler = () => loadData(true);
    window.addEventListener("student-notifications-changed", handler);
    return () => window.removeEventListener("student-notifications-changed", handler);
  }, [loadData]);

  // ── derived state ────────────────────────────────────────────────────────
  const earnedBadges = badgePage.badges.filter((b) => b.earned);
  const lockedBadges = badgePage.badges.filter((b) => !b.earned);

  const earnedCodes = new Set(earnedBadges.map((b) => (b as any).code ?? ""));

  const hasCOURSE_MASTER = earnedCodes.has("COURSE_MASTER");
  const hasQUIZ_MASTER   = earnedCodes.has("QUIZ_MASTER");
  const hasSTREAK        = earnedCodes.has("STREAK_7_DAYS");

  const showMilestones = !hasCOURSE_MASTER || !hasQUIZ_MASTER || !hasSTREAK;

  // ── loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <StudentLayout activeItem="Badges">
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          Loading badges…
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activeItem="Badges">

      {/* ── points card ─────────────────────────────────────────────────── */}
      <Card className="mb-6 rounded-2xl shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Badge Points Earned</p>
              <p className="text-2xl font-bold text-foreground">
                {earnedBadges.reduce((a, b) => a + (b.bonusPoints ?? 0), 0).toLocaleString()} pts
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                from {earnedBadges.length} badge{earnedBadges.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Award className="h-8 w-8 text-primary opacity-50" />
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-40"
                title="Refresh points"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── milestone progress bars ──────────────────────────────────────────
          Each bar disappears automatically once the badge is earned.        */}
      {showMilestones && (
        <div className="space-y-3 mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Progress toward milestone badges
          </p>

          {!hasCOURSE_MASTER && (
            <MilestoneProgressCard
              icon={<BookOpen className="h-4 w-4" />}
              label="Course Master"
              description="Complete 10 different courses"
              current={completedCourses}
              target={10}
              textColor="text-blue-600"
              bgColor="bg-blue-100"
              borderColor="border-blue-100"
            />
          )}

          {!hasQUIZ_MASTER && (
            <MilestoneProgressCard
              icon={<ClipboardList className="h-4 w-4" />}
              label="Quiz Master"
              description="Score 100% on 10 quizzes — first attempt, no wrong answers"
              current={perfectFirstAttempts}
              target={10}
              textColor="text-violet-600"
              bgColor="bg-violet-100"
              borderColor="border-violet-100"
            />
          )}

          {!hasSTREAK && (
            <MilestoneProgressCard
              icon={<Flame className="h-4 w-4" />}
              label="7-Day Streak"
              description="Study 7 consecutive days without missing a day"
              current={currentStreak}
              target={7}
              textColor="text-orange-600"
              bgColor="bg-orange-100"
              borderColor="border-orange-100"
            />
          )}
        </div>
      )}

      {/* ── page title ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Badges</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {earnedBadges.length} earned · {lockedBadges.length} locked
          </p>
        </div>
      </div>

      {/* ── earned badges ── */}
      {earnedBadges.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Earned Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {earnedBadges.map((badge) => (
              <Card
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg rounded-2xl ${tierGlow[badge.tier] ?? ""}`}
              >
                <CardContent className="text-center p-4">
                  <div className="flex flex-col items-center gap-1">
                    <BadgeIcon badge={badge} />
                    <span
                      className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase text-white"
                      style={{ backgroundColor: tierColors[badge.tier] }}
                    >
                      {badge.tier}
                    </span>
                    <p className="text-xs font-bold text-center text-foreground line-clamp-2 pt-1">
                      {badge.name}
                    </p>
                    <p className="text-[10px] text-primary font-semibold">
                      +{badge.bonusPoints ?? 0} pts
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── locked badges ── */}
      {lockedBadges.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Locked Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {lockedBadges.map((badge) => {
              const trigger = (badge as any).trigger ?? "";
              const info    = TRIGGER_INFO[trigger];
              return (
                <Card
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg rounded-2xl opacity-50 hover:opacity-75"
                >
                  <CardContent className="text-center p-4">
                    <div className="relative">
                      <BadgeIcon badge={badge} locked />
                      <Lock className="absolute top-0 right-0 h-4 w-4 text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-center line-clamp-2 mt-2">
                      {badge.name}
                    </p>
                    {/* Show what the student needs to do */}
                    {info && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {info.hint}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      +{badge.bonusPoints ?? 0} pts on unlock
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ── empty state ── */}
      {earnedBadges.length === 0 && lockedBadges.length === 0 && (
        <Card className="rounded-2xl shadow-md text-center p-8">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">
            No badges yet. Start earning points to unlock badges!
          </p>
        </Card>
      )}

      {/* ── badge details dialog ── */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="rounded-2xl">
          {selectedBadge && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <BadgeIcon badge={selectedBadge} locked={!selectedBadge.earned} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">{selectedBadge.name}</h2>
                <div className="mt-2">
                  <Badge
                    className="rounded-full text-white"
                    style={{ backgroundColor: tierColors[selectedBadge.tier] }}
                  >
                    {selectedBadge.tier}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm">{selectedBadge.description}</p>
              </div>

              {/* Show how to earn it if locked */}
              {!selectedBadge.earned && (() => {
                const trigger = (selectedBadge as any).trigger ?? "";
                const info = TRIGGER_INFO[trigger];
                return info ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                      How to earn
                    </p>
                    <p className="text-sm text-blue-800">{info.hint}</p>
                  </div>
                ) : null;
              })()}

              <div className="flex items-center justify-center gap-2 bg-primary/10 rounded-lg p-3">
                <span className="text-lg font-semibold text-primary">
                  +{selectedBadge.bonusPoints ?? 0} points
                </span>
              </div>

              {selectedBadge.earned && selectedBadge.earnedAt && (
                <p className="text-xs text-muted-foreground">
                  Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                </p>
              )}

              {!selectedBadge.earned && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Complete the requirements to unlock this badge and earn{" "}
                    <strong>+{selectedBadge.bonusPoints ?? 0} points</strong>.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
};

export default StudentBadges;