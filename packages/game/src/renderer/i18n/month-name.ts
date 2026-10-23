const REFERENCE_YEAR = 2000;

/**
 * Localised name of a month of the stylised calendar (`month` is 0-11). Names come from `Intl`
 * (ADR 0007) so that no month list is translated by hand.
 */
export function monthName(month: number, language: string): string {
  const name = new Intl.DateTimeFormat(language, { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(REFERENCE_YEAR, month, 1)),
  );
  return name.charAt(0).toLocaleUpperCase(language) + name.slice(1);
}
