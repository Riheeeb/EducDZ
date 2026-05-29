export type StudyLevel = "BEGINNER" | "ELEMENTARY" | "INTERMEDIATE" | "ADVANCED" | "MASTER";

export type Tier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export const studyLevels: { level: StudyLevel; minPoints: number; color: string }[] = [
  { level: "BEGINNER", minPoints: 0, color: "hsl(var(--muted-foreground))" },
  { level: "ELEMENTARY", minPoints: 200, color: "hsl(142 76% 36%)" },
  { level: "INTERMEDIATE", minPoints: 500, color: "hsl(217 91% 60%)" },
  { level: "ADVANCED", minPoints: 700, color: "hsl(280 68% 60%)" },
  { level: "MASTER", minPoints: 1000, color: "hsl(45 93% 47%)" },
];

export const tierColors: Record<Tier, string> = {
  BRONZE: "hsl(30 60% 50%)",
  SILVER: "hsl(0 0% 65%)",
  GOLD: "hsl(45 93% 47%)",
  PLATINUM: "hsl(200 80% 60%)",
};

export function getStudyLevel(points: number): {
  current: typeof studyLevels[0];
  next: typeof studyLevels[0] | null;
  progress: number;
} {
  let current = studyLevels[0];

  for (const level of studyLevels) {
    if (points >= level.minPoints) current = level;
  }

  const currentIndex = studyLevels.indexOf(current);
  const next = currentIndex < studyLevels.length - 1 ? studyLevels[currentIndex + 1] : null;
  const progress = next
    ? ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100
    : 100;

  return { current, next, progress };
}
