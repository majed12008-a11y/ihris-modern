/**
 * قائمة بيضاء (Whitelist) للجداول والأعمدة المسموح استخدامها في تقارير JSON.
 *
 * المبدأ: أسماء الجداول تأتي من قائمة ثابتة في الكود، وأسماء الأعمدة تُتحقّق
 * مقابل بيانات information_schema الفعلية (وليست من إدخال المستخدم)، مع منع
 * أعمدة حساسة صراحةً. هذا يمنع حقن المعرّفات (identifier injection).
 */
import { prisma } from "../lib/prisma";

/** الجداول المسموح بها فقط. أي جدول خارجها يُرفض. */
export const ALLOWED_TABLES: readonly string[] = [
  "people",
  "facilities",
  "positions",
  "jobs",
  "departments",
  "countries",
  "regions",
  "districts",
  "counties",
  "facility_types",
  "position_types",
  "position_statuses",
  "cadres",
  "classifications",
  "employments",
  "person_positions",
  "person_competencies",
  "person_languages",
  "person_ids",
  "educations",
  "salaries",
  "users",
  "roles",
  "user_access",
  "report_definitions",
];

/** أعمدة لا تُعرض أبداً حتى لو وُجدت في الجدول. */
export const DENIED_COLUMNS: ReadonlySet<string> = new Set(["password"]);

/** صيغة صارمة للمعرّفات: حروف/أرقام/شرطة سفلية فقط، تبدأ بحرف أو شرطة سفلية. */
export const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

const columnCache = new Map<string, Set<string>>();

export function isAllowedTable(table: string): boolean {
  return ALLOWED_TABLES.includes(table);
}

/** يجلب أعمدة الجدول من معلومات قاعدة البيانات (مع تخزين مؤقت). */
export async function getTableColumns(table: string): Promise<Set<string>> {
  const cached = columnCache.get(table);
  if (cached) return cached;

  const rows = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
    table
  );

  const columns = new Set(rows.map((r) => r.column_name));
  columnCache.set(table, columns);
  return columns;
}

/** يتحقق من أن الاسم معرّف صالح وليس كلمة SQL محجوزة خطرة. */
export function assertSafeIdentifier(name: string, label: string): void {
  if (typeof name !== "string" || !IDENTIFIER_RE.test(name)) {
    throw new ReportDefinitionError(
      `${label} غير صالح: "${String(name)}" (يجب أن يطابق ${IDENTIFIER_RE.source})`
    );
  }
}

/** خطأ في تعريف التقرير — يُترجم إلى HTTP 400 وليس 500. */
export class ReportDefinitionError extends Error {
  statusCode = 400;
  code = "INVALID_REPORT_DEFINITION";
  constructor(message: string) {
    super(message);
    this.name = "ReportDefinitionError";
  }
}
