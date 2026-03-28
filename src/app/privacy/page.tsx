import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — UtoMate",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to UtoMate
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Overview</h2>
            <p>
              UtoMate is a free, non-commercial web application. We are committed to data minimization:
              we collect as little data as possible and do not store any personal information about our
              users. This policy is provided in accordance with the Swiss Federal Act on Data
              Protection (nDSG / revDSG), in force since 1 September 2023.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Data Controller</h2>
            <p>
              The person responsible for data processing in connection with UtoMate is the individual
              operating this application under the GitHub account{" "}
              <a
                href="https://github.com/weiligao"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                github.com/weiligao
              </a>
              . For all data protection enquiries, please use the{" "}
              <a
                href="https://github.com/weiligao/utomate/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub issue tracker
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Data We Collect Ourselves</h2>
            <p>UtoMate itself does not collect, store, or process any of the following:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Names, email addresses, or any account information</li>
              <li>Search queries or usage history on our own servers</li>
              <li>Cookies set by us for tracking or identification purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Hosting and Server Logs (Vercel)</h2>
            <p>
              This application is hosted on{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Vercel Inc.
              </a>{" "}
              (650 California Street, San Francisco, CA 94108, USA). Like every web host, Vercel
              automatically records standard server log data when your browser requests a page. This
              includes your IP address, browser type, referring URL, and the date and time of access.
              This processing is based on our legitimate interest in operating a functional and secure
              service (Art. 31 nDSG). Log data is retained by Vercel according to their own policies
              and is governed by the{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Vercel Privacy Policy
              </a>
              .
            </p>
            <p className="mt-2">
              Vercel may additionally collect anonymized, aggregated analytics (such as page view
              counts and general geographic regions) which cannot be used to identify individual users.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">International Data Transfer</h2>
            <p>
              Because UtoMate is hosted on Vercel, server log data is processed in the United States.
              Switzerland has not issued an adequacy decision for the USA. Vercel relies on Standard
              Contractual Clauses (SCCs) as the legal safeguard for these transfers. Details can be
              found in the{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Vercel Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Third-Party Data Source</h2>
            <p>
              UtoMate displays tour data scraped from{" "}
              <a
                href="https://www.sac-uto.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                sac-uto.ch
              </a>
              , the website of SAC Sektion Uto. No personal data from that site is collected or
              stored — only publicly available tour listings are fetched and rendered in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Your Rights under nDSG</h2>
            <p>
              Under the Swiss Federal Act on Data Protection you have the following rights regarding
              your personal data:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Right of access</strong> — you may request confirmation of whether we process data about you and receive a copy of it.</li>
              <li><strong>Right to rectification</strong> — you may request correction of inaccurate data.</li>
              <li><strong>Right to erasure</strong> — you may request deletion of your data where there is no overriding legitimate reason to retain it.</li>
              <li><strong>Right to restriction</strong> — you may request that processing of your data be restricted in certain circumstances.</li>
              <li><strong>Right to object</strong> — you may object to processing based on legitimate interest.</li>
            </ul>
            <p className="mt-2">
              Because UtoMate itself stores no personal data, most of these rights would need to be
              exercised directly with Vercel for server log data. To contact us, use the{" "}
              <a
                href="https://github.com/weiligao/utomate/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub issue tracker
              </a>
              . You also have the right to lodge a complaint with the{" "}
              <a
                href="https://www.edoeb.admin.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Federal Data Protection and Information Commissioner (FDPIC)
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
