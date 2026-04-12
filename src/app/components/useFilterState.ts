import { EVENT_TYPE_KURS, EVENT_TYPE_TOUR, GROUPS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { compareDifficulties, getTourWeekdays, isKurs } from "@/lib/utils";
import { useCallback, useMemo } from "react";

const STATUS_ORDER: readonly TourStatus[] = [
  "open",
  "not_yet_open",
  "full_or_cancelled",
  "unknown",
];

const GROUP_ORDER: string[] = GROUPS.map((g) => g.value);

function groupRank(g: string): number {
  const i = GROUP_ORDER.indexOf(g);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

export interface SelectedFilters {
  selectedStatuses: Set<TourStatus>;
  setSelectedStatuses: (v: Set<TourStatus>) => void;
  selectedWeekdays: Set<number>;
  setSelectedWeekdays: (v: Set<number>) => void;
  selectedDurations: Set<number>;
  setSelectedDurations: (v: Set<number>) => void;
  selectedDifficulties: Set<string>;
  setSelectedDifficulties: (v: Set<string>) => void;
  selectedEventTypes: Set<string>;
  setSelectedEventTypes: (v: Set<string>) => void;
  selectedGroups: Set<string>;
  setSelectedGroups: (v: Set<string>) => void;
}

export interface FilterState extends SelectedFilters {
  statuses: TourStatus[];
  durations: number[];
  difficulties: string[];
  eventTypes: string[];
  groups: string[];
  /** Reset all filter dimensions to "show all". */
  resetFilters: () => void;
  /** Returns true if the tour passes all currently active filters. */
  matchesTour: (tour: Tour) => boolean;
}

/**
 * Computes derived filter options and match/reset helpers for a tour list.
 * The selected state is owned externally (e.g. in a parent component) and
 * passed in via `selected`. Pass a stable (memoized) `tours` reference so
 * that the derived useMemos stay cheap.
 */
export function useFilterState(tours: Tour[], selected: SelectedFilters): FilterState {
  const {
    selectedStatuses, setSelectedStatuses,
    selectedWeekdays, setSelectedWeekdays,
    selectedDurations, setSelectedDurations,
    selectedDifficulties, setSelectedDifficulties,
    selectedEventTypes, setSelectedEventTypes,
    selectedGroups, setSelectedGroups,
  } = selected;

  const statuses = useMemo(
    () => STATUS_ORDER.filter((s) => tours.some((t) => t.status === s)),
    [tours],
  );

  const durations = useMemo(
    () => [...new Set(tours.map((t) => t.duration_days))].sort((a, b) => a - b),
    [tours],
  );

  const difficulties = useMemo(
    () => [...new Set(tours.map((t) => t.difficulty))].sort(compareDifficulties),
    [tours],
  );

  const eventTypes = useMemo(() => {
    let hasKurs = false;
    let hasTour = false;
    for (const t of tours) {
      if (isKurs(t.difficulty)) { hasKurs = true; } else { hasTour = true; }
      if (hasKurs && hasTour) { break; }
    }
    const result: string[] = [];
    if (hasTour) { result.push(EVENT_TYPE_TOUR); }
    if (hasKurs) { result.push(EVENT_TYPE_KURS); }
    return result;
  }, [tours]);

  const groups = useMemo(
    () => [...new Set(tours.map((t) => t.group))].sort((a, b) => groupRank(a) - groupRank(b)),
    [tours],
  );

  // Setters from useState are stable — no need to list them as deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resetFilters = useCallback(() => {
    setSelectedStatuses(new Set());
    setSelectedWeekdays(new Set());
    setSelectedDurations(new Set());
    setSelectedDifficulties(new Set());
    setSelectedEventTypes(new Set());
    setSelectedGroups(new Set());
  }, []);

  const matchesTour = useCallback(
    (tour: Tour) => {
      if (selectedWeekdays.size > 0) {
        // getTourWeekdays returns null when start_date is absent — skip weekday filtering for those tours.
        const tourDays = getTourWeekdays(tour.start_date, tour.duration_days);
        if (tourDays !== null && !tourDays.every((d) => selectedWeekdays.has(d))) { return false; }
      }
      return (
        (selectedStatuses.size === 0 || selectedStatuses.has(tour.status)) &&
        (selectedDurations.size === 0 || selectedDurations.has(tour.duration_days)) &&
        (selectedDifficulties.size === 0 || selectedDifficulties.has(tour.difficulty)) &&
        (selectedEventTypes.size === 0 ||
          (selectedEventTypes.has(EVENT_TYPE_KURS) && isKurs(tour.difficulty)) ||
          (selectedEventTypes.has(EVENT_TYPE_TOUR) && !isKurs(tour.difficulty))
        ) &&
        (selectedGroups.size === 0 || selectedGroups.has(tour.group))
      );
    },
    [selectedStatuses, selectedWeekdays, selectedDurations, selectedDifficulties, selectedGroups, selectedEventTypes],
  );

  return {
    ...selected,
    statuses,
    durations,
    difficulties,
    eventTypes,
    groups,
    resetFilters,
    matchesTour,
  };
}
