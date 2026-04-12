import { EVENT_TYPES, GROUPS, TOUR_TYPES, YEARS } from "@/lib/constants";
import type React from "react";
import { useId } from "react";

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const selectClass =
  "w-full appearance-none border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-2.5 m-auto h-4 w-4 text-gray-500"
        fill="none"
        viewBox="0 0 20 20"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="m6 8 4 4 4-4"
        />
      </svg>
    </div>
  );
}

export function SearchForm({
  year,
  setYear,
  typ,
  setTyp,
  eventType,
  setEventType,
  group,
  setGroup,
  loading,
  onSearch,
  expanded,
  setExpanded,
}: {
  year: string;
  setYear: (v: string) => void;
  typ: string;
  setTyp: (v: string) => void;
  eventType: string;
  setEventType: (v: string) => void;
  group: string;
  setGroup: (v: string) => void;
  loading: boolean;
  onSearch: (options?: { keepFilters?: boolean }) => void;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const formId = useId();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={formId}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 cursor-pointer"
      >
        <span className="text-base font-semibold text-gray-800">Touren suchen</span>
        <svg
          aria-hidden="true"
          className={`h-5 w-5 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <form
        id={formId}
        hidden={!expanded}
        className="px-6 pb-6"
        onSubmit={(e) => { e.preventDefault(); onSearch(); }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="filter-year" className="block text-sm font-medium text-gray-700 mb-1">
              Jahr
            </label>
            <SelectWrapper>
              <select
                id="filter-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={selectClass}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>
          <div>
            <label htmlFor="filter-tour-type" className="block text-sm font-medium text-gray-700 mb-1">
              Tourtyp
            </label>
            <SelectWrapper>
              <select
                id="filter-tour-type"
                value={typ}
                onChange={(e) => setTyp(e.target.value)}
                className={selectClass}
              >
                {TOUR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>
          <div>
            <label htmlFor="filter-event-type" className="block text-sm font-medium text-gray-700 mb-1">
              Anlasstyp
            </label>
            <SelectWrapper>
              <select
                id="filter-event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className={selectClass}
              >
                <option value="">Alle</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>
          <div>
            <label htmlFor="filter-group" className="block text-sm font-medium text-gray-700 mb-1">
              Gruppe
            </label>
            <SelectWrapper>
              <select
                id="filter-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className={selectClass}
              >
                <option value="">Alle</option>
                {GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>
          <div className="flex items-end mt-2 sm:mt-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full justify-center inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <Spinner />
                  Suchen…
                </>
              ) : (
                "Suchen"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
