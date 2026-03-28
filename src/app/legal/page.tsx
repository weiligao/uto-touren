import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Notice — UtoMate",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to UtoMate
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Legal Notice</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">About This Application</h2>
            <p>
              UtoMate is a free, open-source, non-commercial web application that lets users search,
              browse, and export tour listings from SAC Sektion Uto as calendar files. The source code
              is publicly available at{" "}
              <a
                href="https://github.com/weiligao/utomate"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                github.com/weiligao/utomate
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">No Affiliation with SAC Sektion Uto</h2>
            <p>
              UtoMate is an independent project. It is <strong>not</strong> affiliated with, endorsed
              by, sponsored by, or in any way officially connected to SAC Sektion Uto or the Swiss
              Alpine Club (SAC/CAS). The SAC Uto name and any related trademarks are the property of
              their respective owners.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Data Source and Accuracy</h2>
            <p>
              Tour data displayed by UtoMate is scraped from{" "}
              <a
                href="https://www.sac-uto.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                sac-uto.ch
              </a>
              , the official website of SAC Sektion Uto. The displayed data is the property of SAC
              Sektion Uto.
            </p>
            <p className="mt-2">
              UtoMate provides no guarantee of accuracy, completeness, timeliness, or availability of
              the data. Always verify tour details directly on the{" "}
              <a
                href="https://www.sac-uto.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                official SAC Uto website
              </a>{" "}
              before making any plans.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Non-Commercial Use</h2>
            <p>
              This application is entirely non-commercial. It does not generate revenue, does not sell
              data to third parties, and does not contain advertising. It is provided free of charge
              solely as a convenience tool for users of sac-uto.ch.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Acceptable Use</h2>
            <p>By using UtoMate, you agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Use this application to mass-scrape, harvest, or systematically extract data from
                sac-uto.ch or from UtoMate itself
              </li>
              <li>
                Redistribute, resell, or republish data obtained through this application without
                permission from SAC Sektion Uto
              </li>
              <li>
                Use this application for any commercial purpose or in a way that violates the terms
                of sac-uto.ch
              </li>
              <li>
                Attempt to circumvent rate limits, overload the application, or interfere with its
                operation
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Disclaimer of Liability</h2>
            <p>
              UtoMate is provided &quot;as is&quot;, without warranty of any kind. The author accepts no
              liability for any loss, injury, or inconvenience arising from use of this application or
              reliance on the information it displays. Use of mountain tour information carries
              inherent risks — always consult official sources and qualified guides.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Open Source License</h2>
            <p>
              UtoMate is released under the{" "}
              <a
                href="https://github.com/weiligao/utomate/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                MIT License
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Applicable Law and Jurisdiction</h2>
            <p>
              These terms and any disputes arising from the use of this application are governed
              exclusively by Swiss law, excluding its conflict-of-law rules. The exclusive place of
              jurisdiction for any disputes is Zurich, Switzerland, to the extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              For legal inquiries or to report concerns, please open an issue on the{" "}
              <a
                href="https://github.com/weiligao/utomate/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
