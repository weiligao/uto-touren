import { EVENT_TYPE_KURS, EVENT_TYPE_TOUR, GROUPS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { compareDifficulties, isKurs } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

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

export interface FilterState {
  statuses: TourStatus[];
  selectedStatuses: Set<TourStatus>;
  setSelectedStatuses: (v: Set<TourStatus>) => void;
  durations: number[];
  selectedDurations: Set<number>;
  setSelectedDurations: (v: Set<number>) => void;
  difficulties: string[];
  selectedDifficulties: Set<string>;
  setSelectedDifficulties: (v: Set<string>) => void;
  eventTypes: string[];
  selectedEventTypes: Set<string>;
  setSelectedEventTypes: (v: Set<string>) => void;
  groups: string[];
  selectedGroups: Set<string>;
  setSelectedGroups: (v: Set<string>) => void;
  /** Reset all filter dimensions to "show all". */
  resetFilters: () => void;
  /** Returns true if the tour passes all currently active filters. */
  matchesTour: (tour: Tour) => boolean;
}

/**
 * Manages filter dimensions (status / duration / difficulty / event type / group) for a tour list.
 * Pass a stable (memoized) `tours` reference so that the derived useMemos stay cheap.
 */
export function useFilterState(tours: Tour[]): FilterState {
  const [selectedStatuses, setSelectedStatuses] = useState<Set<TourStatus>>(new Set());
  const [selectedDurations, setSelectedDurations] = useState<Set<number>>(new Set());
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set());
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

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

  const resetFilters = useCallback(() => {
    setSelectedStatuses(new Set());
    setSelectedDurations(new Set());
    setSelectedDifficulties(new Set());
    setSelectedEventTypes(new Set());
    setSelectedGroups(new Set());
  }, []);

  const matchesTour = useCallback(
    (tour: Tour) =>
      (selectedStatuses.size === 0 || selectedStatuses.has(tour.status)) &&
      (selectedDurations.size === 0 || selectedDurations.has(tour.duration_days)) &&
      (selectedDifficulties.size === 0 || selectedDifficulties.has(tour.difficulty)) &&
      (selectedEventTypes.size === 0 ||
        (selectedEventTypes.has(EVENT_TYPE_KURS) && isKurs(tour.difficulty)) ||
        (selectedEventTypes.has(EVENT_TYPE_TOUR) && !isKurs(tour.difficulty))
      ) &&
      (selectedGroups.size === 0 || selectedGroups.has(tour.group)),
    [selectedStatuses, selectedDurations, selectedDifficulties, selectedGroups, selectedEventTypes],
  );

  return {
    statuses,
    selectedStatuses,
    setSelectedStatuses,
    durations,
    selectedDurations,
    setSelectedDurations,
    difficulties,
    selectedDifficulties,
    setSelectedDifficulties,
    eventTypes,
    selectedEventTypes,
    setSelectedEventTypes,
    groups,
    selectedGroups,
    setSelectedGroups,
    resetFilters,
    matchesTour,
  };
}
