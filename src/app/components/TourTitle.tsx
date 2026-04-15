/**
 * Validates that a URL is safe to use in a link.
 * Only allows http(s) and mailto protocols, blocks javascript: and data: URLs.
 */
function isSafeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, "https://example.com");
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    // Invalid URL or relative path starting with //
    return url.startsWith("http://") || url.startsWith("https://");
  }
}

export function TourTitle({ title, url }: { title: string; url: string | null }) {
  // Only render link if URL is safe
  if (url && isSafeUrl(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {title}
        <span className="sr-only"> (öffnet neuen Tab)</span>
        <svg aria-hidden="true" className="inline h-3 w-3 ml-1 mb-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }
  return title;
}
