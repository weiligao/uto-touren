"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { downloadTourIcs, formatDate, formatDuration, na } from "@/lib/utils";

const TABLE_COLUMNS = [
  "Date",
  "Duration",
  "Tour Type",
  "Event Type",
  "Difficulty",
  "Group",
  "Title",
  "Leader",
  "Status",
] as const;

function StatusDot({ status }: { status: TourStatus }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${STATUS_COLORS[status]}`}
      title={STATUS_LABELS[status]}
    />
  );
}

function TourTitle({ title, url }: { title: string; url: string | null }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {title}
      </a>
    );
  }
  return <>{title}</>;
}

export function TableView({
  tours,
  eventType,
  totalScraped,
}: {
  tours: Tour[];
  eventType: string;
  totalScraped: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Results</h2>
        <span className="text-sm text-gray-500">
          {totalScraped} tours found
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col}
                  className={`px-4 py-3 font-medium text-gray-600 ${col === "Status" ? "text-center" : "text-left"}`}
                >
                  {col}
                </th>
              ))}
              <th className="px-2 py-3 w-8" aria-label="Add to calendar" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tours.map((tour, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                  {formatDate(tour.start_date, tour.date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {formatDuration(tour.duration_days)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {na(tour.tour_type)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {eventType}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {na(tour.difficulty)}
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {na(tour.group)}
                </td>
                <td className="px-4 py-3 text-gray-900">
                  <TourTitle title={na(tour.title)} url={tour.detail_url} />
                </td>
                <td className="px-4 py-3 text-gray-700">{na(tour.leader)}</td>
                <td className="px-4 py-3 text-center">
                  <StatusDot status={tour.status} />
                </td>
                <td className="px-3 py-3 text-center">
                  {tour.start_date && (
                    <button
                      onClick={() => downloadTourIcs(tour)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Download .ics to add this tour to your calendar"
                    >
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      .ics
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
