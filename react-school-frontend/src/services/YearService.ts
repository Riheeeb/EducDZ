// yearService.ts
import api from "@/services/api";

export interface Year {
  id: number;
  year: string; // e.g., "1AM", "2AM", "3AS"
  yearType: string;
  label?: string;
}

// Get all years
export const getAllYears = async (): Promise<Year[]> => {
  const { data } = await api.get("/years");
  return data || [];
};

// Get years in sequence (1AM, 2AM, 3AM, 4AM, 1AS, 2AS, 3AS)
export const getYearsInSequence = async (): Promise<Year[]> => {
  const { data } = await api.get("/years/sequence");
  return data || [];
};

// Get middle school years (1AM - 4AM)
export const getMiddleSchoolYears = async (): Promise<Year[]> => {
  const { data } = await api.get("/years/middle-school");
  return data || [];
};

// Get high school years (1AS - 3AS)
export const getHighSchoolYears = async (): Promise<Year[]> => {
  const { data } = await api.get("/years/high-school");
  return data || [];
};

// Get year by label
export const getYearByLabel = async (label: string): Promise<Year | null> => {
  try {
    const { data } = await api.get(`/years/label/${label}`);
    return data || null;
  } catch {
    return null;
  }
};

// Get next year after a specific year label

export const getNextYearAfter = async (yearLabel: string): Promise<Year | null> => {
  try {
    const { data } = await api.get(`/years/${yearLabel}/next`);
    return data || null;
  } catch {
    return null;
  }
};

// Check if year is the last year (3AS)
export const isLastYear = async (yearLabel: string): Promise<boolean> => {
  try {
    const { data } = await api.get(`/years/${yearLabel}/is-last`);
    return data || false;
  } catch {
    return false;
  }
};

// Check if year is the first year (1AM)
export const isFirstYear = async (yearLabel: string): Promise<boolean> => {
  try {
    const { data } = await api.get(`/years/${yearLabel}/is-first`);
    return data || false;
  } catch {
    return false;
  }
};

// Get streams for a year
export const getStreamsByYear = async (yearId: number) => {
  try {
    const { data } = await api.get(`/years/${yearId}/streams`);
    return data || [];
  } catch {
    return [];
  }
};