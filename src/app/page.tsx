"use client";

import { CalendarView } from "@/app/components/CalendarView";
import { SearchForm } from "@/app/components/SearchForm";
import { TableView } from "@/app/components/TableView";
import type { ScrapeResult } from "@/lib/types";
import { useState } from "react";

type ViewMode = "table" | "calendar";

export default function Home() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [typ, setTyp] = useState("Ht");
  const [eventType, setEventType] = useState("Tour");
  const [group, setGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams({ year, typ, anlasstyp: eventType, gruppe: group });
    try {
      const res = await fetch(`/api/scrape?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">UtoMate</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search and browse tours from sac-uto.ch
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SearchForm
          year={year}
          setYear={setYear}
          typ={typ}
          setTyp={setTyp}
          eventType={eventType}
          setEventType={setEventType}
          group={group}
          setGroup={setGroup}
          loading={loading}
          onSearch={handleSearch}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {result && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "calendar"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Calendar
              </button>
            </div>

            {viewMode === "table" ? (
              <TableView
                tours={result.tours}
                eventType={result.event_type}
                totalScraped={result.total_scraped}
              />
            ) : (
              <CalendarView
                tours={result.tours}
                eventType={result.event_type}
                totalScraped={result.total_scraped}
                year={result.year}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
