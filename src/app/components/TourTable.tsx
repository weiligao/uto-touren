import { STATUS_COLORS } from "@/lib/constants";
import { Tour, TourStatus } from "@/lib/types";

const TABLE_COLUMNS = [
  "Date",
  "Event Type",
  "Type",
  "Difficulty",
  "Duration",
  "Group",
  "Title",
  "Leader",
  "Status",
] as const;

function StatusDot({ status }: { status: TourStatus }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.unknown}`}
      title={status}
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

export function TourTable({
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tours.map((tour, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                  {tour.date}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {eventType}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {tour.tour_type}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                    {tour.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {tour.duration}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {tour.group}
                </td>
                <td className="px-4 py-3 text-gray-900">
                  <TourTitle title={tour.title} url={tour.detail_url} />
                </td>
                <td className="px-4 py-3 text-gray-700">{tour.leader}</td>
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
