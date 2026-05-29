import api from "@/services/api";

export interface StudentBadge {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  bonusPoints: number;
  trigger: string;
  earned: boolean;
  earnedAt: string;
}

export interface StudentBadgePage {
  totalPoints: number;
  badges: StudentBadge[];
}

type RawBadge = {
  id?: number | null;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  iconUrl?: string | null;
  tier?: string | null;
  bonusPoints?: number | null;
  trigger?: string | null;
  earned?: boolean | null;
  earnedAt?: string | null;
};

type RawBadgePage = {
  totalPoints?: number | null;
  totalBonusPointsFromBadges?: number | null;
  badges?: RawBadge[] | null;
  earnedBadges?: RawBadge[] | null;
  lockedBadges?: RawBadge[] | null;
};

const normalizeBadge = (badge: RawBadge, earned: boolean = false): StudentBadge => {
  console.log("RAW BADGE:", badge); 

  return {
    id: badge.id ?? 0,
    name: badge.name ?? "Badge",
    description: badge.description ?? "",
    iconUrl: badge.iconUrl ?? "",
    tier: (badge.tier as StudentBadge["tier"]) ?? "BRONZE",
    bonusPoints: badge.bonusPoints ?? 0,
    trigger: badge.trigger ?? "",
    earned: earned || Boolean(badge.earned),
    earnedAt: badge.earnedAt ?? "",
  };
};

export const getStudentBadgePage = async (studentId: number) => {
  const { data } = await api.get(`/badges/student/${studentId}`);
  const page = (data ?? {}) as RawBadgePage;

  // Handle both old format (badges) and new format (earnedBadges + lockedBadges)
  let allBadges: StudentBadge[] = [];
  
  if (Array.isArray(page.badges)) {
    allBadges = page.badges.map(b => normalizeBadge(b, Boolean(b.earned)));
  } else {
    const earned = Array.isArray(page.earnedBadges)
      ? page.earnedBadges.map(b => normalizeBadge(b, true))
      : [];
    const locked = Array.isArray(page.lockedBadges)
      ? page.lockedBadges.map(b => normalizeBadge(b, false))
      : [];
    allBadges = [...earned, ...locked];
  }

  return {
    totalPoints: page.totalPoints ?? page.totalBonusPointsFromBadges ?? 0,
    badges: allBadges,
  } satisfies StudentBadgePage;
};