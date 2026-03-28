import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { formatDate, formatDuration, na } from "@/lib/utils";

const TABLE_COLUMNS = [
  { label: "Date" },
  { label: "Duration", mobileHidden: true },
  { label: "Tour Type", mobileHidden: true },
  { label: "Event Type", mobileHidden: true },
  { label: "Difficulty", mobileHidden: true },
  { label: "Group", mobileHidden: true },
  { label: "Title" },
  { label: "Tour Leader(s)", mobileHidden: true },
  { label: "Status", center: true },
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tours.map((tour, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                  {formatDate(tour.start_date, tour.date)}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
                  {formatDuration(tour.duration_days)}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
                  {na(tour.tour_type)}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
                  {eventType}
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
                <td className="px-4 py-3 text-center">
                  <StatusDot status={tour.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
