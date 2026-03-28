import type { TourStatus } from "@/lib/types";

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

export const GROUPS = [
  { value: "Jugend", label: "Jugend" },
  { value: "Jung-Alpinist/innen", label: "Jung-Alpinist/innen" },
  { value: "Alpinist/innen", label: "Alpinist/innen" },
  { value: "Senior/innen", label: "Senior/innen" },
] as const;

const currentYear = new Date().getFullYear();
export const YEARS = [String(currentYear), String(currentYear + 1)];

export const STATUS_COLORS: Record<TourStatus, string> = {
  open: "bg-green-500",
  full_or_cancelled: "bg-red-500",
  not_yet_open: "bg-gray-400",
  unknown: "bg-gray-300",
};

export const STATUS_LABELS: Record<TourStatus, string> = {
  open: "Offen",
  full_or_cancelled: "Ausgebucht/Abgesagt",
  not_yet_open: "Noch nicht offen",
  unknown: "Unbekannt",
};
