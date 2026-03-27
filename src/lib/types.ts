export type TourStatus =
  | "open"
  | "full_or_cancelled"
  | "not_yet_open"
  | "unknown";

export interface Tour {
  date: string;
  tour_type: string;
  difficulty: string;
  duration: string;
  group: string;
  title: string;
  leader: string;
  status: TourStatus;
  detail_url: string | null;
}

export interface ScrapeResult {
  source: string;
  year: string;
  type_filter: string;
  event_type: string;
  total_scraped: number;
  tours: Tour[];
}
