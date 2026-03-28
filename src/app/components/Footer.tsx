import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-gray-700 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/legal" className="hover:text-gray-700 hover:underline">
              Legal Notice
            </Link>
            <a
              href="https://github.com/weiligao/utomate"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 hover:underline"
            >
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>{process.env.NEXT_PUBLIC_APP_VERSION}</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://github.com/weiligao/utomate/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 hover:underline"
            >
              Release notes
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
