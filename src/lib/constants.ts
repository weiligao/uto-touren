import type { TourStatus } from "@/lib/types";

export const EVENT_TYPE_TOUR = "Tour" as const;
export const EVENT_TYPE_KURS = "Kurs" as const;

export const TOUR_TYPES = [
  { value: "Ak", label: "Alpinklettern" },
  { value: "Aw", label: "Alpinwandern (T4–T6)" },
  { value: "Aa", label: "Andere Anlässe" },
  { value: "Ek", label: "Eisklettern" },
  { value: "Ht", label: "Hochtour" },
  { value: "JX", label: "Jugend-Andere Anlässe" },
  { value: "JB", label: "Jugend-Bouldern" },
  { value: "JE", label: "Jugend-Eisklettern" },
  { value: "JH", label: "Jugend-Hochtour" },
  { value: "JK", label: "Jugend-Klettern" },
  { value: "JS", label: "Jugend-Skitour" },
  { value: "Ks", label: "Klettersteigtour" },
  { value: "Mb", label: "Mountainbiketour" },
  { value: "Ss", label: "Schneeschuhtour" },
  { value: "Sk", label: "Skitour" },
  { value: "Sb", label: "Snowboardtour" },
  { value: "Sp", label: "Sport-/Plaisirklettern" },
  { value: "Tr", label: "Trailrun" },
  { value: "Wa", label: "Wandern (T1–T3)" },
] as const;

export const EVENT_TYPES = [
  { value: "Tour", label: "Tour" },
  { value: "Kurs", label: "Kurs" },
] as const;

export const GROUP_DELIMITER = "|";

/** Special group value meaning "applies to all groups" (not a selectable filter option). */
export const SPECIAL_GROUP_ALLE = "Alle";

export const GROUPS = [
  { value: "Jugend", label: "Jugend" },
  { value: "Jung-Alpinist/innen", label: "Jung-Alpinist/innen" },
  { value: "Alpinist/innen", label: "Alpinist/innen" },
  { value: "Senior/innen", label: "Senior/innen" },
] as const;

const THIS_YEAR = new Date().getFullYear();
export const YEARS = [String(THIS_YEAR), String(THIS_YEAR + 1)];

export const STATUS_COLORS: Record<TourStatus, string> = {
  open: "bg-green-500",
  full_or_cancelled: "bg-red-500",
  not_yet_open: "bg-gray-400",
  unknown: "bg-gray-300",
};

export const STATUS_LABELS: Record<TourStatus, string> = {
  open: "Offen",
  full_or_cancelled: "Voll/Abgesagt",
  not_yet_open: "Nicht offen",
  unknown: "Unbekannt",
};

/** Screen-reader-friendly labels (no slash, reads naturally in TTS). */
export const STATUS_ARIA_LABELS: Record<TourStatus, string> = {
  open: "Offen",
  full_or_cancelled: "Voll oder Abgesagt",
  not_yet_open: "Nicht offen",
  unknown: "Unbekannt",
};

/** Known difficulty values in ascending order, grouped by scale. */
export const DIFFICULTY_ORDER: readonly string[] = [
  // Alpine SAC scale (L = Leicht … SS = Sehr Schwierig)
  "L", "WS-", "WS", "WS+", "ZS-", "ZS", "ZS+", "S-", "S", "S+", "SS",
  // Hiking SAC/CAS T scale
  "T1", "T2", "T3", "T4", "T5", "T6",
  // UIAA rock climbing (Roman numerals)
  "I", "II", "III", "IV", "V", "VI",
  // French sport climbing grades
  "3a", "3b", "3c",
  "4a", "4b", "4c",
  "5a", "5b", "5c",
  "6a", "6a+", "6b", "6b+", "6c", "6c+",
  "7a",
  // Klettersteig (K1–K6)
  "K1", "K2", "K3", "K4", "K5", "K6",
  // Kursschwierigkeit (KSI–KSV)
  "KSI", "KSII", "KSIII", "KSIV", "KSV",
  // Schneeschuh SAC (WT1–WT5)
  "WT1", "WT2", "WT3", "WT4", "WT5",
  // Mountainbike Singletrail scale (S0–S3)
  "S0", "S1", "S2", "S3",
  // Ice climbing (Wi1-I … Wi5-IV)
  "Wi1-I", "Wi1-II", "Wi1-III", "Wi1-IV",
  "Wi2-I", "Wi2-II", "Wi2-III", "Wi2-IV",
  "Wi3-I", "Wi3-II", "Wi3-III", "Wi3-IV",
  "Wi4-I", "Wi4-II", "Wi4-III", "Wi4-IV",
  "Wi5-I", "Wi5-II", "Wi5-III", "Wi5-IV",
];
