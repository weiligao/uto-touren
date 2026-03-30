import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung für UtoTouren. Wir erheben keine personenbezogenen Daten. Gehostet auf Vercel mit anonymisierten Analysen.",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          <span aria-hidden="true">←</span> Zurück zu UtoTouren
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-gray-500 mb-8">Stand: März 2026</p>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Überblick</h2>
            <p>
              UtoTouren ist eine kostenlose, nicht-kommerzielle Webanwendung. Wir verpflichten uns zur Datensparsamkeit:
              Wir erheben so wenig Daten wie möglich und speichern keine personenbezogenen Informationen über unsere
              Nutzer. Diese Erklärung entspricht den Anforderungen des Schweizer Bundesgesetzes über den Datenschutz
              (nDSG / revDSG), in Kraft seit 1. September 2023.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenverarbeitung im Zusammenhang mit UtoTouren ist die Person,
              die diese Anwendung unter dem GitHub-Konto{" "}
              <a
                href="https://github.com/weiligao"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                github.com/weiligao
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>
              {" "}betreibt. Für alle datenschutzrelevanten Anfragen verwenden Sie bitte den{" "}
              <a
                href="https://github.com/weiligao/uto-touren/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub Issue Tracker
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Von uns selbst erhobene Daten</h2>
            <p>UtoTouren selbst erhebt, speichert oder verarbeitet keine der folgenden Daten:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Namen, E-Mail-Adressen oder sonstige Kontoinformationen</li>
              <li>Suchanfragen oder Nutzungsverlauf auf unseren Servern</li>
              <li>Von uns gesetzte Cookies zur Verfolgung oder Identifizierung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Hosting und Server-Logs (Vercel)</h2>
            <p>
              Diese Anwendung wird von{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Vercel Inc.
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>{" "}
              (650 California Street, San Francisco, CA 94108, USA) gehostet. Wie jeder Webhoster erfasst Vercel
              beim Abruf einer Seite automatisch Standard-Server-Logdaten. Dazu gehören IP-Adresse, Browsertyp,
              verweisende URL sowie Datum und Uhrzeit des Zugriffs. Diese Verarbeitung stützt sich auf unser
              berechtigtes Interesse am Betrieb eines funktionalen und sicheren Dienstes (Art. 31 nDSG).
              Logdaten werden von Vercel gemäss deren eigenen Richtlinien aufbewahrt und unterliegen der{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Datenschutzerklärung von Vercel
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>
              .
            </p>
            <p className="mt-2">
              UtoTouren verwendet ausserdem <strong>Vercel Analytics</strong> und <strong>Vercel Speed Insights</strong>,
              um aggregierte, anonymisierte Nutzungsdaten zu erheben — darunter Seitenaufrufe, allgemeine
              geografische Regionen sowie Core-Web-Vitals-Metriken zur Leistungsüberwachung. Diese Dienste
              verwenden keine Cookies, erheben keine personenbezogenen Daten und ermöglichen keine
              Identifizierung einzelner Nutzer.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Internationale Datenübermittlung</h2>
            <p>
              Da UtoTouren auf Vercel gehostet wird, werden Server-Logdaten in den USA verarbeitet.
              Die Schweiz hat für die USA keinen Angemessenheitsbeschluss erlassen. Vercel stützt sich
              auf Standardvertragsklauseln (SCC) als rechtliche Schutzgarantie für diese Übermittlungen.
              Einzelheiten finden Sie in der{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Datenschutzerklärung von Vercel
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Drittanbieter-Datenquelle</h2>
            <p>
              UtoTouren zeigt Tourdaten an, die von{" "}
              <a
                href="https://www.sac-uto.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                sac-uto.ch
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>
              , der Website der SAC-Sektion Uto, abgerufen werden. Es werden keine personenbezogenen
              Daten dieser Website erhoben oder gespeichert — es werden ausschliesslich öffentlich
              zugängliche Tourenlisten abgerufen und in Ihrem Browser angezeigt.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Ihre Rechte nach nDSG</h2>
            <p>
              Das Schweizer Bundesgesetz über den Datenschutz gewährt Ihnen folgende Rechte in Bezug
              auf Ihre personenbezogenen Daten:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Auskunftsrecht</strong> — Sie können eine Bestätigung verlangen, ob wir Daten über Sie verarbeiten, und eine Kopie davon erhalten.</li>
              <li><strong>Recht auf Berichtigung</strong> — Sie können die Korrektur unrichtiger Daten verlangen.</li>
              <li><strong>Recht auf Löschung</strong> — Sie können die Löschung Ihrer Daten verlangen, sofern kein überwiegender legitimer Grund für deren Aufbewahrung besteht.</li>
              <li><strong>Recht auf Einschränkung</strong> — Sie können in bestimmten Fällen eine Einschränkung der Verarbeitung Ihrer Daten verlangen.</li>
              <li><strong>Widerspruchsrecht</strong> — Sie können der Verarbeitung auf Grundlage berechtigter Interessen widersprechen.</li>
            </ul>
            <p className="mt-2">
              Da UtoTouren selbst keine personenbezogenen Daten speichert, müssen die meisten dieser
              Rechte für Server-Logdaten direkt bei Vercel geltend gemacht werden. Um uns zu kontaktieren,
              nutzen Sie den{" "}
              <a
                href="https://github.com/weiligao/uto-touren/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub Issue Tracker
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>
              . Sie haben ausserdem das Recht, beim{" "}
              <a
                href="https://www.edoeb.admin.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB)
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>
              {" "}Beschwerde einzureichen.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
