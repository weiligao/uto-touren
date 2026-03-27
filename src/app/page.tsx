"use client";

import { SearchForm } from "@/app/components/SearchForm";
import { TourTable } from "@/app/components/TourTable";
import { ScrapeResult } from "@/lib/types";
import { useState } from "react";

export default function Home() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [typ, setTyp] = useState("Ht");
  const [eventType, setEventType] = useState("Tour");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams({ year, typ, anlasstyp: eventType });
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
          <h1 className="text-2xl font-bold text-gray-900">UtoMat</h1>
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
          loading={loading}
          onSearch={handleSearch}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {result && (
          <TourTable
            tours={result.tours}
            eventType={result.event_type}
            totalScraped={result.total_scraped}
          />
        )}
      </main>
    </div>
  );
}
