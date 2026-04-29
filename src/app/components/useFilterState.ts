import { EVENT_TYPE_KURS, EVENT_TYPE_TOUR, GROUPS, SPECIAL_GROUP_ALLE, TOUR_TYPES, YEARS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { compareDifficulties, getTourWeekdays, isKurs, parseLeaders } from "@/lib/utils";
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

/** Check if a tour applies to all groups (is not restricted to specific groups). */
function tourAppliesToAllGroups(tour: Tour): boolean {
  return tour.group.includes(SPECIAL_GROUP_ALLE);
}

export interface SelectedFilters {
  selectedYears: Set<string>;
  setSelectedYears: (v: Set<string>) => void;
  selectedTourTypes: Set<string>;
  setSelectedTourTypes: (v: Set<string>) => void;
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
  selectedLeaders: Set<string>;
  setSelectedLeaders: (v: Set<string>) => void;
  selectedTitles: Set<string>;
  setSelectedTitles: (v: Set<string>) => void;
}

export interface FilterState extends SelectedFilters {
  years: string[];
  tourTypes: string[];
  statuses: TourStatus[];
  durations: number[];
  difficulties: string[];
  eventTypes: string[];
  groups: string[];
  leaders: string[];
  titles: string[];
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
    selectedYears, setSelectedYears,
    selectedTourTypes, setSelectedTourTypes,
    selectedStatuses, setSelectedStatuses,
    selectedWeekdays, setSelectedWeekdays,
    selectedDurations, setSelectedDurations,
    selectedDifficulties, setSelectedDifficulties,
    selectedEventTypes, setSelectedEventTypes,
    selectedGroups, setSelectedGroups,
    selectedLeaders, setSelectedLeaders,
    selectedTitles, setSelectedTitles,
  } = selected;

  // For faceted search: each dimension's options come from tours that pass
  // every OTHER active filter. This keeps options relevant to the current selection.

  const toursPassingAllExcept = useCallback((exclude: "years" | "tourTypes" | "statuses" | "weekdays" | "durations" | "difficulties" | "eventTypes" | "groups" | "leaders" | "titles") => {
    return tours.filter((tour) => {
      if (exclude !== "weekdays" && selectedWeekdays.size > 0) {
        const tourDays = getTourWeekdays(tour.start_date, tour.duration_days);
        if (!tourDays.every((d) => selectedWeekdays.has(d))) { return false; }
      }
      return (
        (exclude === "years" || selectedYears.size === 0 || selectedYears.has(tour.start_date.slice(0, 4))) &&
        (exclude === "tourTypes" || selectedTourTypes.size === 0 || selectedTourTypes.has(tour.tour_type)) &&
        (exclude === "statuses" || selectedStatuses.size === 0 || selectedStatuses.has(tour.status)) &&
        (exclude === "durations" || selectedDurations.size === 0 || selectedDurations.has(tour.duration_days)) &&
        (exclude === "difficulties" || selectedDifficulties.size === 0 || selectedDifficulties.has(tour.difficulty)) &&
        (exclude === "eventTypes" || selectedEventTypes.size === 0 ||
          (selectedEventTypes.has(EVENT_TYPE_KURS) && isKurs(tour.difficulty)) ||
          (selectedEventTypes.has(EVENT_TYPE_TOUR) && !isKurs(tour.difficulty))) &&
        (exclude === "groups" || selectedGroups.size === 0 || tourAppliesToAllGroups(tour) || tour.group.some((g) => selectedGroups.has(g))) &&
        (exclude === "leaders" || selectedLeaders.size === 0 || parseLeaders(tour.leader).some((leader) => selectedLeaders.has(leader))) &&
        (exclude === "titles" || selectedTitles.size === 0 || selectedTitles.has(tour.title))
      );
    });
  }, [tours, selectedYears, selectedTourTypes, selectedStatuses, selectedWeekdays, selectedDurations, selectedDifficulties, selectedEventTypes, selectedGroups, selectedLeaders, selectedTitles]);

  const years = useMemo(
    () => YEARS.filter((y) => toursPassingAllExcept("years").some((t) => t.start_date.startsWith(y))),
    [toursPassingAllExcept],
  );

  const tourTypes = useMemo(
    () => TOUR_TYPES.map((t) => t.value).filter((v) => toursPassingAllExcept("tourTypes").some((t) => t.tour_type === v)),
    [toursPassingAllExcept],
  );

  const statuses = useMemo(
    () => STATUS_ORDER.filter((s) => toursPassingAllExcept("statuses").some((t) => t.status === s)),
    [toursPassingAllExcept],
  );

  const durations = useMemo(
    () => [...new Set(toursPassingAllExcept("durations").map((t) => t.duration_days))].sort((a, b) => a - b),
    [toursPassingAllExcept],
  );

  const difficulties = useMemo(
    () => [...new Set(toursPassingAllExcept("difficulties").map((t) => t.difficulty))].sort(compareDifficulties),
    [toursPassingAllExcept],
  );

  const eventTypes = useMemo(() => {
    let hasKurs = false;
    let hasTour = false;
    for (const t of toursPassingAllExcept("eventTypes")) {
      if (isKurs(t.difficulty)) { hasKurs = true; } else { hasTour = true; }
      if (hasKurs && hasTour) { break; }
    }
    const result: string[] = [];
    if (hasTour) { result.push(EVENT_TYPE_TOUR); }
    if (hasKurs) { result.push(EVENT_TYPE_KURS); }
    return result;
  }, [toursPassingAllExcept]);

  const groups = useMemo(
    () => {
      const allGroups = toursPassingAllExcept("groups")
        .flatMap((t) => t.group)
        .filter((g: string) => g !== SPECIAL_GROUP_ALLE);
      return [...new Set(allGroups)].sort((a, b) => groupRank(a) - groupRank(b));
    },
    [toursPassingAllExcept],
  );

  const leaders = useMemo(
    () => {
      const allLeaders = toursPassingAllExcept("leaders")
        .flatMap((t) => parseLeaders(t.leader));
      return [...new Set(allLeaders)].sort((a, b) => a.localeCompare(b));
    },
    [toursPassingAllExcept],
  );

  const titles = useMemo(
    () => {
      const allTitles = toursPassingAllExcept("titles").map((t) => t.title);
      return [...new Set(allTitles)].sort((a, b) => a.localeCompare(b));
    },
    [toursPassingAllExcept],
  );

  // Setters from useState are stable — per React docs, they don't need to be in deps.
  // Including them here to satisfy React Compiler analysis.
  const resetFilters = useCallback(() => {
    setSelectedYears(new Set());
    setSelectedTourTypes(new Set());
    setSelectedStatuses(new Set());
    setSelectedWeekdays(new Set());
    setSelectedDurations(new Set());
    setSelectedDifficulties(new Set());
    setSelectedEventTypes(new Set());
    setSelectedGroups(new Set());
    setSelectedLeaders(new Set());
    setSelectedTitles(new Set());
  }, [setSelectedYears, setSelectedTourTypes, setSelectedStatuses, setSelectedWeekdays, setSelectedDurations, setSelectedDifficulties, setSelectedEventTypes, setSelectedGroups, setSelectedLeaders, setSelectedTitles]);

  // Setters are not used; only the selected* state values are checked.
  const matchesTour = useCallback(
    (tour: Tour) => {
      if (selectedWeekdays.size > 0) {
        const tourDays = getTourWeekdays(tour.start_date, tour.duration_days);
        if (!tourDays.every((d) => selectedWeekdays.has(d))) { return false; }
      }
      return (
        (selectedYears.size === 0 || selectedYears.has(tour.start_date.slice(0, 4))) &&
        (selectedTourTypes.size === 0 || selectedTourTypes.has(tour.tour_type)) &&
        (selectedStatuses.size === 0 || selectedStatuses.has(tour.status)) &&
        (selectedDurations.size === 0 || selectedDurations.has(tour.duration_days)) &&
        (selectedDifficulties.size === 0 || selectedDifficulties.has(tour.difficulty)) &&
        (selectedEventTypes.size === 0 ||
          (selectedEventTypes.has(EVENT_TYPE_KURS) && isKurs(tour.difficulty)) ||
          (selectedEventTypes.has(EVENT_TYPE_TOUR) && !isKurs(tour.difficulty))
        ) &&
        (selectedGroups.size === 0 || tourAppliesToAllGroups(tour) || tour.group.some((g) => selectedGroups.has(g))) &&
        (selectedLeaders.size === 0 || parseLeaders(tour.leader).some((leader) => selectedLeaders.has(leader))) &&
        (selectedTitles.size === 0 || selectedTitles.has(tour.title))
      );
    },
    [selectedYears, selectedTourTypes, selectedStatuses, selectedWeekdays, selectedDurations, selectedDifficulties, selectedEventTypes, selectedGroups, selectedLeaders, selectedTitles],
  );

  return {
    ...selected,
    years,
    tourTypes,
    statuses,
    durations,
    difficulties,
    eventTypes,
    groups,
    leaders,
    titles,
    resetFilters,
    matchesTour,
  };
}
