"use client";

import { STATUS_ARIA_LABELS, STATUS_COLORS, STATUS_LABELS, TOUR_TYPES } from "@/lib/constants";
import type { TourStatus } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { memo, useId, useMemo, useState } from "react";

const TOUR_TYPE_LABEL = new Map<string, string>(TOUR_TYPES.map((t) => [t.value, t.label]));

const WEEKDAYS: { key: number; label: string; fullName: string }[] = [
  { key: 1, label: "Mo", fullName: "Montag" },
  { key: 2, label: "Di", fullName: "Dienstag" },
  { key: 3, label: "Mi", fullName: "Mittwoch" },
  { key: 4, label: "Do", fullName: "Donnerstag" },
  { key: 5, label: "Fr", fullName: "Freitag" },
  { key: 6, label: "Sa", fullName: "Samstag" },
  { key: 0, label: "So", fullName: "Sonntag" },
];

const chipBase =
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0";
const chipActive = "border-blue-600 bg-blue-600 text-white";
const chipInactive =
  "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";

/** Toggle an item in a Set, returning a new Set. Treats undefined as an empty Set. */
function toggleSet<T>(set: Set<T> | undefined, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) { next.delete(item); } else { next.add(item); }
  return next;
}

/**
 * A 16×16 visible dot with a 44×44 invisible touch-target button layered on top.
 * The dot stays in layout flow so the label column height is never affected by
 * whether the button is active or not.
 */
function ResetButton({ label, onReset, visible }: { label: string; onReset: () => void; visible: boolean }) {
  return (
    <div aria-live="polite" className={`group relative shrink-0 h-4 w-4 ${visible ? "" : "invisible"}`}>
      <span aria-hidden="true" className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 group-hover:bg-red-500 transition-colors pointer-events-none">
        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
      <button
        type="button"
        aria-label={label}
        onClick={onReset}
        tabIndex={visible ? 0 : -1}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-h-11 min-w-11 rounded cursor-pointer"
      />
    </div>
  );
}

function FilterRow({
  labelId,
  label,
  hasActive,
  onReset,
  resetLabel,
  children,
}: {
  labelId: string;
  label: string;
  hasActive: boolean;
  onReset: () => void;
  resetLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-y-1.5 gap-x-4 items-start"
    >
      <div className="flex items-center gap-1.5 sm:pt-1">
        <span
          id={labelId}
          className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 shrink-0"
        >
          {label}
        </span>
        <ResetButton label={resetLabel} onReset={onReset} visible={hasActive} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  );
}

export const ResultsHeader = memo(function ResultsHeader({
  totalScraped,
  visibleCount,
  years,
  selectedYears,
  onYearsChange,
  tourTypes,
  selectedTourTypes,
  onTourTypesChange,
  statuses,
  selectedStatuses,
  onStatusesChange,
  selectedWeekdays,
  onWeekdaysChange,
  durations,
  selectedDurations,
  onDurationsChange,
  difficulties,
  selectedDifficulties,
  onDifficultiesChange,
  eventTypes,
  selectedEventTypes,
  onEventTypesChange,
  groups,
  selectedGroups,
  onGroupsChange,
  leaders,
  selectedLeaders,
  onLeadersChange,
}: {
  totalScraped: number;
  visibleCount: number;
  years?: string[];
  selectedYears?: Set<string>;
  onYearsChange?: (v: Set<string>) => void;
  tourTypes?: string[];
  selectedTourTypes?: Set<string>;
  onTourTypesChange?: (v: Set<string>) => void;
  statuses?: TourStatus[];
  selectedStatuses?: Set<TourStatus>;
  onStatusesChange?: (v: Set<TourStatus>) => void;
  selectedWeekdays?: Set<number>;
  onWeekdaysChange?: (v: Set<number>) => void;
  durations?: number[];
  selectedDurations?: Set<number>;
  onDurationsChange?: (v: Set<number>) => void;
  difficulties?: string[];
  selectedDifficulties?: Set<string>;
  onDifficultiesChange?: (v: Set<string>) => void;
  eventTypes?: string[];
  selectedEventTypes?: Set<string>;
  onEventTypesChange?: (v: Set<string>) => void;
  groups?: string[];
  selectedGroups?: Set<string>;
  onGroupsChange?: (v: Set<string>) => void;
  leaders?: string[];
  selectedLeaders?: Set<string>;
  onLeadersChange?: (v: Set<string>) => void;
}) {
  const hasFilterRows =
    !!(years && years.length > 1) ||
    !!(tourTypes && tourTypes.length > 1) ||
    !!(statuses && statuses.length > 1) ||
    // Weekday chips are fixed (always 7 options), so show whenever the handler is provided.
    !!onWeekdaysChange ||
    !!(durations && durations.length > 1) ||
    !!(difficulties && difficulties.length > 1) ||
    !!(eventTypes && eventTypes.length > 1) ||
    !!(groups && groups.length > 1) ||
    !!(leaders && leaders.length > 1);
  const activeFilterCount =
    (selectedYears?.size ?? 0) +
    (selectedTourTypes?.size ?? 0) +
    (selectedStatuses?.size ?? 0) +
    (selectedWeekdays?.size ?? 0) +
    (selectedDurations?.size ?? 0) +
    (selectedDifficulties?.size ?? 0) +
    (selectedEventTypes?.size ?? 0) +
    (selectedGroups?.size ?? 0) +
    (selectedLeaders?.size ?? 0);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const filterPanelId = useId();
  const yearLabelId = useId();
  const tourTypeLabelId = useId();
  const statusLabelId = useId();
  const weekdayLabelId = useId();
  const durationLabelId = useId();
  const difficultyLabelId = useId();
  const eventTypeLabelId = useId();
  const groupLabelId = useId();
  const leaderLabelId = useId();

  return (
    <div className="border-b border-gray-200">
      {/* Header bar */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Touren</h2>
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-12">
          {hasFilterRows && (
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls={filterPanelId}
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <svg
                aria-hidden="true"
                className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none"
                  >
                    {activeFilterCount}
                  </span>
                  <span className="sr-only">({activeFilterCount} aktiv)</span>
                </>
              )}
            </button>
          )}
          <span
            aria-live="polite"
            title={`${visibleCount} von ${totalScraped} Touren angezeigt`}
            className="text-sm text-gray-500 tabular-nums"
          >
            <span aria-hidden="true" className="sm:hidden">
              {visibleCount} / {totalScraped} Touren
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              {visibleCount} von {totalScraped} Touren angezeigt
            </span>
            <span className="sr-only">
              {visibleCount} von {totalScraped} Touren angezeigt
            </span>
          </span>
        </div>
      </div>

      {/* Filter panel */}
      {hasFilterRows && (
        <div
          id={filterPanelId}
          hidden={!filtersOpen}
          className="border-t border-gray-100 bg-gray-50/60 px-6 py-4 flex flex-col gap-4"
        >
          {statuses && statuses.length > 1 && (
            <FilterRow
              labelId={statusLabelId}
              label="Status"
              hasActive={!!selectedStatuses?.size}
              onReset={() => onStatusesChange?.(new Set())}
              resetLabel="Status-Filter zurücksetzen"
            >
              {statuses.map((s) => {
                const active = selectedStatuses?.has(s) ?? false;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    aria-label={STATUS_ARIA_LABELS[s]}
                    onClick={() => onStatusesChange?.(toggleSet(selectedStatuses, s))}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-2 w-2 rounded-full shrink-0 ${active ? "bg-white/80" : STATUS_COLORS[s]}`}
                    />
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {tourTypes && tourTypes.length > 1 && (
            <FilterRow
              labelId={tourTypeLabelId}
              label="Tourtyp"
              hasActive={!!selectedTourTypes?.size}
              onReset={() => onTourTypesChange?.(new Set())}
              resetLabel="Tourtyp-Filter zurücksetzen"
            >
              {tourTypes.map((tt) => {
                const active = selectedTourTypes?.has(tt) ?? false;
                return (
                  <button
                    key={tt}
                    type="button"
                    aria-pressed={active}
                    aria-label={TOUR_TYPE_LABEL.get(tt) ?? tt}
                    onClick={() => onTourTypesChange?.(toggleSet(selectedTourTypes, tt))}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {TOUR_TYPE_LABEL.get(tt) ?? tt}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {eventTypes && eventTypes.length > 1 && (
            <FilterRow
              labelId={eventTypeLabelId}
              label="Anlasstyp"
              hasActive={!!selectedEventTypes?.size}
              onReset={() => onEventTypesChange?.(new Set())}
              resetLabel="Anlasstyp-Filter zurücksetzen"
            >
              {eventTypes.map((et) => {
                const active = selectedEventTypes?.has(et) ?? false;
                return (
                  <button
                    key={et}
                    type="button"
                    aria-pressed={active}
                    aria-label={et}
                    onClick={() => onEventTypesChange?.(toggleSet(selectedEventTypes, et))}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {et}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {years && years.length > 1 && (
            <FilterRow
              labelId={yearLabelId}
              label="Jahr"
              hasActive={!!selectedYears?.size}
              onReset={() => onYearsChange?.(new Set())}
              resetLabel="Jahr-Filter zurücksetzen"
            >
              {years.map((y) => {
                const active = selectedYears?.has(y) ?? false;
                return (
                  <button
                    key={y}
                    type="button"
                    aria-pressed={active}
                    aria-label={y}
                    onClick={() => onYearsChange?.(toggleSet(selectedYears, y))}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {y}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {onWeekdaysChange && (
            <FilterRow
              labelId={weekdayLabelId}
              label="Wochentag"
              hasActive={!!selectedWeekdays?.size}
              onReset={() => onWeekdaysChange(new Set())}
              resetLabel="Wochentag-Filter zurücksetzen"
            >
              {WEEKDAYS.map(({ key, label, fullName }) => {
                const active = selectedWeekdays?.has(key) ?? false;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    aria-label={fullName}
                    onClick={() => onWeekdaysChange(toggleSet(selectedWeekdays, key))}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {label}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {durations && durations.length > 1 && (
            <FilterRow
              labelId={durationLabelId}
              label="Dauer (Tage)"
              hasActive={!!selectedDurations?.size}
              onReset={() => onDurationsChange?.(new Set())}
              resetLabel="Dauer-Filter zurücksetzen"
            >
              {durations.map((d) => {
                const active = selectedDurations?.has(d) ?? false;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={active}
                    aria-label={formatDuration(d)}
                    onClick={() => onDurationsChange?.(toggleSet(selectedDurations, d))}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {d}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {difficulties && difficulties.length > 1 && (
            <FilterRow
              labelId={difficultyLabelId}
              label="Schwierigkeit"
              hasActive={!!selectedDifficulties?.size}
              onReset={() => onDifficultiesChange?.(new Set())}
              resetLabel="Schwierigkeits-Filter zurücksetzen"
            >
              {difficulties.map((d) => {
                const active = selectedDifficulties?.has(d) ?? false;
                return (
                  <button
                    key={d || "__empty__"}
                    type="button"
                    aria-pressed={active}
                    aria-label={d || "Unbekannt"}
                    onClick={() => onDifficultiesChange?.(toggleSet(selectedDifficulties, d))}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {d || "—"}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {groups && groups.length > 1 && (
            <FilterRow
              labelId={groupLabelId}
              label="Gruppe"
              hasActive={!!selectedGroups?.size}
              onReset={() => onGroupsChange?.(new Set())}
              resetLabel="Gruppen-Filter zurücksetzen"
            >
              {groups.map((g) => {
                const active = selectedGroups?.has(g) ?? false;
                return (
                  <button
                    key={g !== "" ? g : "__empty__"}
                    type="button"
                    aria-pressed={active}
                    aria-label={g !== "" ? g : "Unbekannt"}
                    onClick={() => onGroupsChange?.(toggleSet(selectedGroups, g))}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {g !== "" ? g : "—"}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {leaders && leaders.length > 1 && (
            <LeaderFilterRow
              labelId={leaderLabelId}
              leaders={leaders}
              selectedLeaders={selectedLeaders}
              onLeadersChange={onLeadersChange}
            />
          )}
        </div>
      )}
    </div>
  );
});

const LEADER_SEARCH_BLUR_DELAY_MS = 200;

function LeaderFilterRow({
  labelId,
  leaders,
  selectedLeaders,
  onLeadersChange,
}: {
  labelId: string;
  leaders: string[];
  selectedLeaders?: Set<string>;
  onLeadersChange?: (v: Set<string>) => void;
}) {
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredLeaders = useMemo(
    () => leaders.filter((leader) => leader.toLowerCase().includes(searchText.toLowerCase())),
    [leaders, searchText],
  );

  const hasActive = !!selectedLeaders?.size;
  const selectedLeadersList = useMemo(() => Array.from(selectedLeaders ?? []), [selectedLeaders]);
  // availableLeaders excludes already-selected ones to avoid duplicate selections in dropdown
  const availableLeaders = useMemo(
    () => filteredLeaders.filter((leader) => !selectedLeaders?.has(leader)),
    [filteredLeaders, selectedLeaders],
  );
  // Dropdown visible only when user actively typing; used in both render conditional and aria-expanded
  const isDropdownVisible = showDropdown && searchText;

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    // Dropdown shows only when user has typed something; close when search is cleared
    setShowDropdown(value.length > 0);
  };

  // Single handler for both adding (from dropdown) and removing (from chips):
  // toggleSet handles both cases via the toggle logic
  const handleLeaderSelect = (leader: string) => {
    onLeadersChange?.(toggleSet(selectedLeaders, leader));
    setSearchText("");
    setShowDropdown(false);
  };

  const handleReset = () => {
    onLeadersChange?.(new Set());
    setSearchText("");
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    // Reopen dropdown on refocus if search text remains (blur closes it after a delay)
    if (searchText) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay blur to prevent dropdown from closing before option click registers
    setTimeout(() => setShowDropdown(false), LEADER_SEARCH_BLUR_DELAY_MS);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      setSearchText("");
    }
  };

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-y-1.5 gap-x-4 items-start"
    >
      <div className="flex items-center gap-1.5 sm:pt-1">
        <span
          id={labelId}
          className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 shrink-0"
        >
          Leiter/in
        </span>
        <ResetButton
          label="Leiter/in-Filter zurücksetzen"
          onReset={handleReset}
          visible={hasActive}
        />
      </div>
      <div className="flex flex-col gap-2">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Nach Name suchen…"
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Nach Leiter/in-Name suchen"
            aria-controls="leader-dropdown"
          />

          {/* Dropdown options: only shown when user has typed (controlled by handleSearchChange) */}
          {isDropdownVisible && (
            <div
              id="leader-dropdown"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md z-10 max-h-48 overflow-y-auto"
            >
              {availableLeaders.length > 0 ? (
                availableLeaders.map((leader) => (
                  <button
                    key={leader}
                    type="button"
                    role="option"
                    aria-selected={selectedLeaders.has(leader)}
                    onClick={() => handleLeaderSelect(leader)}
                    // Prevent blur when option is clicked; blur would close dropdown before handleLeaderSelect fires
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors"
                  >
                    {leader}
                  </button>
                ))
              ) : (
                <div role="status" className="px-3 py-2 text-sm text-gray-500 italic">Keine Leiter/innen gefunden</div>
              )}
            </div>
          )}
        </div>

        {/* Selected leaders displayed as blue chips below search input */}
        {selectedLeadersList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedLeadersList.map((leader) => (
              <button
                key={leader}
                type="button"
                aria-pressed={true}
                aria-label={`${leader} entfernen`}
                onClick={() => handleLeaderSelect(leader)}
                className={`${chipBase} ${chipActive}`}
              >
                {leader}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


