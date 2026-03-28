import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-gray-700 hover:underline">
              Datenschutz
            </Link>
            <Link href="/legal" className="hover:text-gray-700 hover:underline">
              Impressum
            </Link>
            <a
              href="https://github.com/weiligao/uto-touren"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 hover:underline"
            >
              GitHub
              <span className="sr-only"> (öffnet neuen Tab)</span>
            </a>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>{process.env.NEXT_PUBLIC_APP_VERSION}</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://github.com/weiligao/uto-touren/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 hover:underline"
            >
              Versionshinweise
              <span className="sr-only"> (öffnet neuen Tab)</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
