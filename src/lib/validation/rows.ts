/**
 * Reads repeatable rows from a form. A row's fields are named `<prefix>_<field>_<i>` (for example `education_degree_0`),
 * or `<prefix>_<i>` when `fields` is empty (a single text per row). Rows that are completely empty are skipped.
 */
export function collectRows(fd: FormData, prefix: string, fields: string[] = [], max = 20): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  for (let i = 0; i < max; i++) {
    const names = fields.length ? fields.map((f) => [f, `${prefix}_${f}_${i}`] as const) : ([["value", `${prefix}_${i}`]] as const);
    const row: Record<string, string> = {};
    let any = false;
    for (const [field, name] of names) {
      const v = fd.get(name);
      const str = typeof v === "string" ? v.trim() : "";
      row[field] = str;
      if (str !== "") any = true;
    }
    if (any) rows.push(row);
  }
  return rows;
}
