// Quotes cells, and defuses spreadsheet formulas ("=...", "+...") that could run when staff open the file in Excel.
export function csvCell(v: string | number | null | undefined): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
export const csvRow = (cells: (string | number | null | undefined)[]) => cells.map(csvCell).join(",");
