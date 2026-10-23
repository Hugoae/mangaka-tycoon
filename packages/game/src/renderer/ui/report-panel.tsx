import { useTranslation } from "react-i18next";

import type { Report } from "./report";

export interface ReportPanelProps {
  readonly report: Report;
}

/** What the last action did, and why: the chapter breakdown, then the journal lines. */
export function ReportPanel(props: ReportPanelProps) {
  const { t } = useTranslation();
  const { breakdown, messages } = props.report;
  if (breakdown.length === 0 && messages.length === 0) {
    return null;
  }

  return (
    <section className="report" aria-label={t("report.title")}>
      <h2 className="panel__subtitle">{t("report.title")}</h2>
      <ul className="report__list">
        {messages.map((message, index) => (
          // The report is replaced as a whole on each command: the index is a stable identity.
          <li key={`message-${String(index)}`}>{message}</li>
        ))}
      </ul>
      {breakdown.length === 0 ? null : (
        <ul className="report__list report__list--detail">
          {breakdown.map((line, index) => (
            <li key={`line-${String(index)}`}>{line}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
