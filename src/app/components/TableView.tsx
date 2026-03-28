"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { formatDate, formatDuration, na } from "@/lib/utils";
import { Fragment, useState } from "react";
import { IcsButton } from "./IcsButton";
import { ResultsHeader } from "./ResultsHeader";
import { TourTitle } from "./TourTitle";

const TABLE_COLUMNS: { label: string; mobileHidden?: boolean; center?: boolean }[] = [
  { label: "Date" },
  { label: "Duration", mobileHidden: true },
  { label: "Difficulty", mobileHidden: true },
  { label: "Group", mobileHidden: true },
  { label: "Title" },
  { label: "Tour Leader(s)", mobileHidden: true },
  { label: "Status", center: true, mobileHidden: true },
];

function StatusDot({ status }: { status: TourStatus }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${STATUS_COLORS[status]}`}
      title={STATUS_LABELS[status]}
    />
  );
}

export function TableView({
  tours,
  totalScraped,
}: {
  tours: Tour[];
  totalScraped: number;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [hideFull, setHideFull] = useState(false);
  const toggleRow = (i: number) => setExpandedRows((prev) => {
    const next = new Set(prev);
    if (next.has(i)) { next.delete(i); } else { next.add(i); }
    return next;
  });

  const visibleTours = tours
    .map((tour, i) => ({ tour, i }))
    .filter(({ tour }) => !hideFull || tour.status !== "full_or_cancelled");

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <ResultsHeader
        totalScraped={totalScraped}
        visibleCount={visibleTours.length}
        hideFull={hideFull}
        onHideFullChange={setHideFull}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={[
                    "px-4 py-3 font-medium text-gray-600",
                    col.center ? "text-center" : "text-left",
                    col.mobileHidden ? "hidden sm:table-cell" : "",
                  ].join(" ")}
                >
                  {col.label}
                </th>
              ))}
              <th className="hidden sm:table-cell px-2 py-3 w-8" aria-label="Add to calendar" />
              <th className="sm:hidden px-2 pr-4 py-3 w-8" aria-label="Expand row" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleTours.map(({ tour, i }) => {
              const expanded = expandedRows.has(i);
              return (
                <Fragment key={i}>
                  <tr
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`sm:hidden inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[tour.status]}`} />
                        {formatDate(tour.start_date, tour.date)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
                      {formatDuration(tour.duration_days)}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
                      {na(tour.difficulty)}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
                      {na(tour.group)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <TourTitle title={na(tour.title)} url={tour.detail_url} />
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-gray-700">{na(tour.leader)}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center">
                      <StatusDot status={tour.status} />
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-center">
                      <IcsButton tour={tour} compact />
                    </td>
                    <td className="sm:hidden px-2 pr-4 py-3 text-center">
                      <button
                        onClick={() => toggleRow(i)}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
                        aria-label={expanded ? "Collapse" : "Expand"}
                      >
                        <svg
                          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="sm:hidden bg-gray-50 border-b border-gray-100">
                      <td colSpan={4} className="px-4 py-3">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <dt className="font-medium text-gray-500">Duration</dt>
                            <dd className="text-gray-800">{formatDuration(tour.duration_days)}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Difficulty</dt>
                            <dd className="text-gray-800">{na(tour.difficulty)}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Group</dt>
                            <dd className="text-gray-800">{na(tour.group)}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Leader</dt>
                            <dd className="text-gray-800">{na(tour.leader)}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Status</dt>
                            <dd className="flex items-center gap-1.5 text-gray-800">
                              <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[tour.status]}`} />
                              {STATUS_LABELS[tour.status]}
                            </dd>
                          </div>
                          <div className="flex items-end">
                            <IcsButton tour={tour} />
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
