export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  // Excel and several field-service platforms export UTF-8 CSVs with a BOM.
  // If it is left on the first header, agreement_id/customer matching silently fails.
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; i++; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(field.trim()); field = ""; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i++;
      row.push(field.trim()); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""])));
}

export function numberValue(value: string | undefined, fallback = 0) {
  const parsed = Number((value ?? "").replace(/[$,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}
