import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum für UtoTouren. Diese App ist nicht mit der SAC Sektion Uto verbunden. Daten stammen von sac-uto.ch.",
  robots: { index: false },
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Zurück zu UtoTouren
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Impressum</h1>
        <p className="text-sm text-gray-500 mb-8">Stand: März 2026</p>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Über diese Anwendung</h2>
            <p>
              UtoTouren ist eine kostenlose, quelloffene, nicht-kommerzielle Webanwendung, mit der Nutzer
              Tourenlisten der SAC Sektion Uto suchen, filtern und als Kalenderdateien exportieren können.
              Der Quellcode ist öffentlich verfügbar unter{" "}
              <a
                href="https://github.com/weiligao/uto-touren"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                github.com/weiligao/uto-touren
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Keine Verbindung zur SAC Sektion Uto</h2>
            <p>
              UtoTouren ist ein unabhängiges Projekt. Es ist <strong>nicht</strong> mit der SAC Sektion Uto
              oder dem Schweizer Alpen-Club (SAC/CAS) verbunden, von diesen unterstützt, gesponsert oder
              offiziell anerkannt. Der Name SAC Uto sowie allfällige Markenzeichen sind Eigentum ihrer
              jeweiligen Inhaber.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Datenquelle und Genauigkeit</h2>
            <p>
              Die von UtoTouren angezeigten Tourdaten werden von{" "}
              <a
                href="https://www.sac-uto.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                sac-uto.ch
              </a>
              , der offiziellen Website der SAC Sektion Uto, abgerufen. Die angezeigten Daten sind
              Eigentum der SAC Sektion Uto.
            </p>
            <p className="mt-2">
              UtoTouren übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit, Aktualität oder
              Verfügbarkeit der Daten. Überprüfen Sie Tourdetails stets direkt auf der{" "}
              <a
                href="https://www.sac-uto.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                offiziellen SAC-Uto-Website
              </a>{" "}
              bevor Sie Planungen vornehmen.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Nicht-kommerzielle Nutzung</h2>
            <p>
              Diese Anwendung ist vollständig nicht-kommerziell. Sie erzielt keine Einnahmen, verkauft
              keine Daten an Dritte und enthält keine Werbung. Sie wird kostenlos und ausschliesslich
              als Hilfsmittel für Nutzer von sac-uto.ch bereitgestellt.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Zulässige Nutzung</h2>
            <p>Mit der Nutzung von UtoTouren erklären Sie sich damit einverstanden, Folgendes zu unterlassen:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Diese Anwendung zum Massen-Scraping, Harvesting oder systematischen Extrahieren von Daten
                von sac-uto.ch oder UtoTouren selbst zu nutzen
              </li>
              <li>
                Über diese Anwendung erhaltene Daten ohne Genehmigung der SAC Sektion Uto weiterzuverbreiten,
                weiterzuverkaufen oder neu zu veröffentlichen
              </li>
              <li>
                Diese Anwendung für kommerzielle Zwecke oder in einer Weise zu nutzen, die gegen die
                Nutzungsbedingungen von sac-uto.ch verstösst
              </li>
              <li>
                Ratenlimits zu umgehen, die Anwendung zu überlasten oder ihren Betrieb zu stören
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Haftungsausschluss</h2>
            <p>
              UtoTouren wird &quot;wie besehen&quot; ohne jegliche Gewährleistung bereitgestellt. Der Autor übernimmt
              keine Haftung für Verluste, Schäden oder Unannehmlichkeiten, die aus der Nutzung dieser
              Anwendung oder dem Vertrauen auf die darin angezeigten Informationen entstehen. Die Nutzung
              von Bergtoureninformationen ist mit inhärenten Risiken verbunden — konsultieren Sie stets
              offizielle Quellen und qualifizierte Bergführer.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Open-Source-Lizenz</h2>
            <p>
              UtoTouren steht unter der{" "}
              <a
                href="https://github.com/weiligao/uto-touren/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                MIT-Lizenz
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Anwendbares Recht und Gerichtsstand</h2>
            <p>
              Diese Bedingungen und allfällige Streitigkeiten aus der Nutzung dieser Anwendung unterliegen
              ausschliesslich Schweizer Recht unter Ausschluss der Kollisionsnormen. Ausschliesslicher
              Gerichtsstand für Streitigkeiten ist, soweit gesetzlich zulässig, Zürich, Schweiz.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Kontakt</h2>
            <p>
              Für rechtliche Anfragen oder zur Meldung von Problemen eröffnen Sie bitte ein Issue im{" "}
              <a
                href="https://github.com/weiligao/uto-touren/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub-Repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
