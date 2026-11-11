import type { z } from "zod";

export type FormValues = Record<string, string | boolean>;

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string>; values: FormValues };

interface FieldInfo {
  type: string; // "string" | "number" | "boolean" | ...
  optional: boolean;
  nullable: boolean;
}

interface AnyDef {
  type: string;
  innerType?: { def: AnyDef };
}

/** Looks through optional / nullable / default wrappers to find the real type of a field. */
function describeField(field: { def: AnyDef }): FieldInfo {
  let def = field.def;
  let optional = false;
  let nullable = false;
  while (def.innerType) {
    if (def.type === "optional" || def.type === "default") optional = true;
    if (def.type === "nullable") nullable = true;
    def = def.innerType.def;
  }
  return { type: def.type, optional, nullable };
}

const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

interface IssueLike {
  code: string;
  message: string;
  origin?: string;
  maximum?: number | bigint;
  minimum?: number | bigint;
  input?: unknown;
  expected?: string;
}

/** Arabic text for a Zod issue. Messages written in Arabic inside the schemas are kept as they are. */
function arabicMessage(issue: IssueLike): string {
  if (hasArabic(issue.message)) return issue.message;
  switch (issue.code) {
    case "invalid_type":
      return "هذا الحقل مطلوب";
    case "too_small":
      if (issue.origin === "string" && Number(issue.minimum) <= 1) return "هذا الحقل مطلوب";
      if (issue.origin === "string") return `الحد الأدنى ${issue.minimum} أحرف`;
      if (issue.origin === "array") return `الحد الأدنى ${issue.minimum} عناصر`;
      return `القيمة يجب ألا تقل عن ${issue.minimum}`;
    case "too_big":
      if (issue.origin === "string") return `الحد الأقصى ${issue.maximum} حرفًا`;
      if (issue.origin === "array") return `الحد الأقصى ${issue.maximum} عناصر`;
      return `القيمة يجب ألا تزيد عن ${issue.maximum}`;
    case "invalid_format":
      return "قيمة غير صالحة";
    case "invalid_value":
      return "اختر قيمة صحيحة";
    default:
      return "قيمة غير صالحة";
  }
}

/** Validates an already built object. Same result shape as `parseForm`. */
export function parseValues<S extends z.ZodType>(
  schema: S,
  raw: Record<string, unknown>,
  values: FormValues = {},
): ParseResult<z.output<S>> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in errors)) errors[key] = arabicMessage(issue as IssueLike);
  }
  return { ok: false, errors, values };
}

/**
 * Turns FormData into an object using the schema's field types, then validates it:
 * - checkbox -> boolean (an unchecked checkbox is simply not sent)
 * - empty string -> `null` for nullable fields, `undefined` for the others
 * - numeric strings -> numbers where the schema expects a number
 */
export function parseForm<S extends z.ZodType>(schema: S, formData: FormData): ParseResult<z.output<S>> {
  const shape = (schema as unknown as { shape?: Record<string, { def: AnyDef }> }).shape ?? {};
  const raw: Record<string, unknown> = {};
  const values: FormValues = {};
  const notNumbers: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    const info = describeField(field);
    if (info.type === "boolean") {
      const on = formData.has(key);
      raw[key] = on;
      values[key] = on;
      continue;
    }
    const entry = formData.get(key);
    const str = typeof entry === "string" ? entry : "";
    values[key] = str;
    if (str.trim() === "") {
      raw[key] = info.nullable ? null : undefined;
    } else if (info.type === "number") {
      const n = Number(str);
      if (Number.isNaN(n)) notNumbers.push(key);
      raw[key] = n;
    } else {
      raw[key] = str;
    }
  }
  const result = parseValues(schema, raw, values);
  if (!result.ok) {
    for (const key of notNumbers) result.errors[key] = "أدخل رقمًا صحيحًا";
  }
  return result;
}
