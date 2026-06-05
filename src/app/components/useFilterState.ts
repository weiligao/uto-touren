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

// Dimension indices map: used to efficiently exclude one dimension at a time when building facets.
const DIMENSION_INDICES = {
  year: 0,
  tourType: 1,
  status: 2,
  duration: 3,
  difficulty: 4,
  eventType: 5,
  group: 6,
  leader: 7,
  title: 8,
  weekdays: 9,
} as const;

type EnrichedTour = Tour & {
  parsedLeaders: string[];
  weekdayArray: number[];
};

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
  showPastTours: boolean;
  setShowPastTours: (v: boolean) => void;
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
  // Extract only the setters; selected values are accessed via the `selected` object parameter
  const {
    setSelectedYears,
    setSelectedTourTypes,
    setSelectedStatuses,
    setSelectedWeekdays,
    setSelectedDurations,
    setSelectedDifficulties,
    setSelectedEventTypes,
    setSelectedGroups,
    setSelectedLeaders,
    setSelectedTitles,
  } = selected;

  const enrichedTourMap = useMemo(() => {
    const map = new Map<Tour, EnrichedTour>();

    for (const tour of tours) {
      map.set(tour, {
        ...tour,
        parsedLeaders: parseLeaders(tour.leader),
        weekdayArray: getTourWeekdays(tour.start_date, tour.duration_days),
      });
    }

    return map;
  }, [tours]);

  const computeMatchVector = useCallback(
    (enrichedTour: EnrichedTour, selected: SelectedFilters): boolean[] => [
      selected.selectedYears.size === 0 || selected.selectedYears.has(enrichedTour.start_date.slice(0, 4)),
      selected.selectedTourTypes.size === 0 || selected.selectedTourTypes.has(enrichedTour.tour_type),
      selected.selectedStatuses.size === 0 || selected.selectedStatuses.has(enrichedTour.status),
      selected.selectedDurations.size === 0 || selected.selectedDurations.has(enrichedTour.duration_days),
      selected.selectedDifficulties.size === 0 || selected.selectedDifficulties.has(enrichedTour.difficulty),
      selected.selectedEventTypes.size === 0 ||
        (selected.selectedEventTypes.has(EVENT_TYPE_KURS) && isKurs(enrichedTour.difficulty)) ||
        (selected.selectedEventTypes.has(EVENT_TYPE_TOUR) && !isKurs(enrichedTour.difficulty)),
      selected.selectedGroups.size === 0 || tourAppliesToAllGroups(enrichedTour) || enrichedTour.group.some((g) => selected.selectedGroups.has(g)),
      selected.selectedLeaders.size === 0 || enrichedTour.parsedLeaders.some((leader) => selected.selectedLeaders.has(leader)),
      selected.selectedTitles.size === 0 || selected.selectedTitles.has(enrichedTour.title),
      selected.selectedWeekdays.size === 0 || enrichedTour.weekdayArray.every((d) => selected.selectedWeekdays.has(d)),
    ],
    [] // Static matching logic
  );

  const enrichedTours = useMemo(() => Array.from(enrichedTourMap.values()), [enrichedTourMap]);

  const {
    years,
    tourTypes,
    statuses,
    durations,
    difficulties,
    eventTypes,
    groups,
    leaders,
    titles,
  } = useMemo(() => {
    const yearsSet = new Set<string>();
    const tourTypesSet = new Set<string>();
    const statusesSet = new Set<TourStatus>();
    const durationsSet = new Set<number>();
    const difficultiesSet = new Set<string>();
    const groupsSet = new Set<string>();
    const leadersSet = new Set<string>();
    const titlesSet = new Set<string>();
    let hasKursOption = false;
    let hasTourOption = false;

    const passExcept = (matchVector: boolean[], excludeIndex: number): boolean => {
      for (let i = 0; i < matchVector.length; i++) {
        if (i !== excludeIndex && !matchVector[i]) {
          return false;
        }
      }
      return true;
    };

    for (const tour of enrichedTours) {
      // Exclude past tours from facet options when they're hidden, so the filter
      // lists stay consistent with the visible (matchesTour) result set.
      if (!selected.showPastTours && tour.isPast) { continue; }
      const matchVector = computeMatchVector(tour, selected);

      if (passExcept(matchVector, DIMENSION_INDICES.year)) { yearsSet.add(tour.start_date.slice(0, 4)); }
      if (passExcept(matchVector, DIMENSION_INDICES.tourType)) { tourTypesSet.add(tour.tour_type); }
      if (passExcept(matchVector, DIMENSION_INDICES.status)) { statusesSet.add(tour.status); }
      if (passExcept(matchVector, DIMENSION_INDICES.duration)) { durationsSet.add(tour.duration_days); }
      if (passExcept(matchVector, DIMENSION_INDICES.difficulty)) { difficultiesSet.add(tour.difficulty); }
      if (passExcept(matchVector, DIMENSION_INDICES.eventType)) {
        if (isKurs(tour.difficulty)) { hasKursOption = true; } else { hasTourOption = true; }
      }
      if (passExcept(matchVector, DIMENSION_INDICES.group)) {
        for (const group of tour.group) {
          if (group !== SPECIAL_GROUP_ALLE) { groupsSet.add(group); }
        }
      }
      if (passExcept(matchVector, DIMENSION_INDICES.leader)) { tour.parsedLeaders.forEach((leader) => leadersSet.add(leader)); }
      if (passExcept(matchVector, DIMENSION_INDICES.title)) { titlesSet.add(tour.title); }
    }

    const eventTypesResult: string[] = [];
    if (hasTourOption) { eventTypesResult.push(EVENT_TYPE_TOUR); }
    if (hasKursOption) { eventTypesResult.push(EVENT_TYPE_KURS); }

    return {
      years: YEARS.filter((y) => yearsSet.has(y)),
      tourTypes: TOUR_TYPES.map((t) => t.value).filter((v) => tourTypesSet.has(v)),
      statuses: STATUS_ORDER.filter((s) => statusesSet.has(s)),
      durations: [...durationsSet].sort((a, b) => a - b),
      difficulties: [...difficultiesSet].sort(compareDifficulties),
      eventTypes: eventTypesResult,
      groups: [...groupsSet].sort((a, b) => groupRank(a) - groupRank(b)),
      leaders: [...leadersSet].sort((a, b) => a.localeCompare(b)),
      titles: [...titlesSet].sort((a, b) => a.localeCompare(b)),
    };
  }, [enrichedTours, selected, computeMatchVector]);

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
      const enrichedTour = enrichedTourMap.get(tour);
      // Contract: tours passed here must be from enrichedTourMap. If undefined, tours array was mutated
      // or a different array's tour was passed — both are bugs in calling code.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const matchVector = computeMatchVector(enrichedTour!, selected);

      if (selected.selectedWeekdays.size > 0 && !matchVector[DIMENSION_INDICES.weekdays]) {
        return false;
      }
      if (!selected.showPastTours && tour.isPast) {
        return false;
      }

      return matchVector.every((match) => match);
    },
    [selected, enrichedTourMap, computeMatchVector],
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
