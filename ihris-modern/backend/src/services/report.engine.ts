/**
 * محرك تنفيذ التقارير المخصص (Report Engine).
 *
 * التصميم (ADR-004):
 *  - SQL parameterized فقط: كل القيم تُمرّر كـ $1..$n، ولا تُدمج في النص أبداً.
 *  - المعرّفات (جداول/أعمدة) تُتحقّق من قائمة بيضاء + معلومات information_schema.
 *  - حد أقصى للنتائج (10,000 افتراضياً) وحد زمني (30 ثانية) لكل استعلام.
 */
import { prisma } from "../lib/prisma";
import {
  ALLOWED_TABLES,
  DENIED_COLUMNS,
  assertSafeIdentifier,
  getTableColumns,
  isAllowedTable,
  ReportDefinitionError,
} from "./report.whitelist";

export const DEFAULT_MAX_ROWS = 10000;
export const HARD_MAX_ROWS = 50000;
export const DEFAULT_TIMEOUT_MS = 30000;
export const MAX_FIELDS = 50;
export const MAX_FILTERS = 30;
export const MAX_IN_VALUES = 100;
export const MAX_STRING_LENGTH = 500;

const AGGREGATE_FNS = new Set(["count", "sum", "avg", "min", "max"]);
const COMPARISON_OPS: Record<string, string> = {
  eq: "=",
  ne: "<>",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "LIKE",
  ilike: "ILIKE",
};

export interface EngineOptions {
  /** أقصى عدد صفوف مسموح (لأدوار خاصة يمكن رفعه حتى HARD_MAX_ROWS). */
  maxRows?: number;
  /** الحد الزمني بالمللي ثانية. */
  timeoutMs?: number;
}

export interface EngineResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  sql: string;
  paramCount: number;
  executionTimeMs: number;
}

interface BuiltQuery {
  sql: string;
  params: unknown[];
  columns: string[];
  limit: number;
}

type Scalar = string | number | boolean | null;

interface FilterSpec {
  op: string;
  value: unknown;
}

export class ReportEngine {
  /** يبني الاستعلام ويتحقق من التعريف دون تنفيذه (قابل للاختبار). */
  static async build(definition: unknown, options: EngineOptions = {}): Promise<BuiltQuery> {
    const def = this.assertObject(definition, "تعريف التقرير");

    // 1) الجدول
    const table = def.table;
    if (typeof table !== "string" || !isAllowedTable(table)) {
      throw new ReportDefinitionError(
        `الجدول "${String(table)}" غير مسموح. الجداول المسموحة: ${ALLOWED_TABLES.join(", ")}`
      );
    }
    assertSafeIdentifier(table, "اسم الجدول");

    const tableColumns = await getTableColumns(table);
    if (tableColumns.size === 0) {
      throw new ReportDefinitionError(`الجدول "${table}" غير موجود في قاعدة البيانات`);
    }

    const resolveColumn = (name: unknown, label: string): string => {
      if (typeof name !== "string") {
        throw new ReportDefinitionError(`${label} يجب أن يكون نصاً`);
      }
      assertSafeIdentifier(name, label);
      if (DENIED_COLUMNS.has(name)) {
        throw new ReportDefinitionError(`${label} "${name}" عمود حساس وغير مسموح`);
      }
      if (!tableColumns.has(name)) {
        throw new ReportDefinitionError(`${label} "${name}" غير موجود في الجدول "${table}"`);
      }
      return name;
    };

    // 2) الحقول
    if (!Array.isArray(def.fields) || def.fields.length === 0) {
      throw new ReportDefinitionError("حقل fields مطلوب ويجب أن يحتوي على عمود واحد على الأقل");
    }
    if (def.fields.length > MAX_FIELDS) {
      throw new ReportDefinitionError(`عدد الحقول يتجاوز الحد الأقصى (${MAX_FIELDS})`);
    }
    const fields = def.fields.map((f: unknown, i: number) =>
      resolveColumn(f, `الحقل رقم ${i + 1}`)
    );

    // 3) التجميع
    const groupByRaw = def.groupBy;
    let groupBy: string[] = [];
    if (groupByRaw !== undefined) {
      if (!Array.isArray(groupByRaw)) {
        throw new ReportDefinitionError("groupBy يجب أن يكون مصفوفة");
      }
      groupBy = groupByRaw.map((g: unknown, i: number) =>
        resolveColumn(g, `حقل التجميع رقم ${i + 1}`)
      );
      for (const g of groupBy) {
        if (!fields.includes(g)) {
          throw new ReportDefinitionError(`حقل التجميع "${g}" يجب أن يكون ضمن fields`);
        }
      }
    }

    // 4) الدوال التجميعية
    const aggregatesRaw = def.aggregates ?? [];
    if (!Array.isArray(aggregatesRaw)) {
      throw new ReportDefinitionError("aggregates يجب أن يكون مصفوفة");
    }
    if (aggregatesRaw.length > 10) {
      throw new ReportDefinitionError("عدد الدوال التجميعية يتجاوز الحد الأقصى (10)");
    }
    const aggSelects: string[] = [];
    const aggAliases = new Set<string>();
    for (const [i, raw] of aggregatesRaw.entries()) {
      const agg = this.assertObject(raw, `العنصر التجميعي رقم ${i + 1}`);
      const fn = String(agg.fn ?? "").toLowerCase();
      if (!AGGREGATE_FNS.has(fn)) {
        throw new ReportDefinitionError(`دالة تجميع غير مسموحة: "${String(agg.fn)}"`);
      }
      const alias = String(agg.as ?? `${fn}_${i + 1}`);
      assertSafeIdentifier(alias, "اسم العمود الناتج (as)");
      if (aggAliases.has(alias)) {
        throw new ReportDefinitionError(`اسم ناتج مكرر: "${alias}"`);
      }
      aggAliases.add(alias);

      if (agg.field === "*" || agg.field === undefined) {
        if (fn !== "count") {
          throw new ReportDefinitionError(`"*" مسموح فقط مع count وليس مع ${fn}`);
        }
        aggSelects.push(`COUNT(*) AS "${alias}"`);
      } else {
        const field = resolveColumn(agg.field, `حقل الدالة التجميعية رقم ${i + 1}`);
        aggSelects.push(`${fn.toUpperCase()}("${field}") AS "${alias}"`);
      }
    }

    // عند وجود GROUP BY كل الأعمدة غير المجمّعة يجب أن تكون ضمنه
    if (groupBy.length > 0) {
      for (const f of fields) {
        if (!groupBy.includes(f)) {
          throw new ReportDefinitionError(
            `عند استخدام groupBy يجب أن يكون العمود "${f}" ضمن groupBy`
          );
        }
      }
    }

    // 5) المعاملات المسماة
    const namedParams = def.params === undefined ? {} : this.assertObject(def.params, "params");
    for (const [k, v] of Object.entries(namedParams)) {
      assertSafeIdentifier(k, "اسم المعامل");
      if (!this.isScalar(v)) {
        throw new ReportDefinitionError(`قيمة المعامل "${k}" يجب أن تكون قيمة مفردة`);
      }
    }

    const params: unknown[] = [];
    const addValue = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };
    const resolveValue = (value: unknown, label: string): unknown => {
      if (typeof value === "string" && value.startsWith(":")) {
        const name = value.slice(1);
        assertSafeIdentifier(name, "اسم المعامل المشار إليه");
        if (!(name in namedParams)) {
          throw new ReportDefinitionError(`المعامل "${name}" غير معرّف في params`);
        }
        return namedParams[name];
      }
      if (this.isScalar(value)) return value;
      throw new ReportDefinitionError(`${label} يجب أن تكون قيمة مفردة أو معاملاً مسماة`);
    };

    // 6) الفلاتر (WHERE)
    const filtersRaw = def.filters ?? {};
    const filters = this.assertObject(filtersRaw, "filters");
    if (Object.keys(filters).length > MAX_FILTERS) {
      throw new ReportDefinitionError(`عدد الفلاتر يتجاوز الحد الأقصى (${MAX_FILTERS})`);
    }

    const whereClauses: string[] = [];
    for (const [key, rawValue] of Object.entries(filters)) {
      const column = resolveColumn(key, "حقل الفلتر");
      const spec = this.normalizeFilter(rawValue);

      if (spec.op === "isNull") {
        const truthy = spec.value === true || spec.value === "true";
        whereClauses.push(`"${column}" IS ${truthy ? "NULL" : "NOT NULL"}`);
        continue;
      }

      if (spec.op === "in") {
        // القيمة إما مصفوفة مباشرة أو معامل مسماة يشير إلى مصفوفة
        let value: unknown = spec.value;
        if (typeof value === "string" && value.startsWith(":")) {
          const name = value.slice(1);
          assertSafeIdentifier(name, "اسم المعامل المشار إليه");
          if (!(name in namedParams)) {
            throw new ReportDefinitionError(`المعامل "${name}" غير معرّف في params`);
          }
          value = namedParams[name];
        }
        if (!Array.isArray(value)) {
          throw new ReportDefinitionError(`الفلتر "${key}" مع in يتطلب مصفوفة`);
        }
        if (value.length === 0) {
          whereClauses.push("1 = 0");
          continue;
        }
        if (value.length > MAX_IN_VALUES) {
          throw new ReportDefinitionError(`عدد قيم in يتجاوز الحد الأقصى (${MAX_IN_VALUES})`);
        }
        const placeholders = value.map((v) => addValue(this.checkScalar(v, key)));
        whereClauses.push(`"${column}" IN (${placeholders.join(", ")})`);
        continue;
      }

      const value = resolveValue(spec.value, `قيمة الفلتر "${key}"`);

      if (Array.isArray(value)) {
        throw new ReportDefinitionError(
          `الفلتر "${key}" مصفوفة؛ استخدم {"op":"in","value":[...]}`
        );
      }

      const sqlOp = COMPARISON_OPS[spec.op];
      if (!sqlOp) {
        throw new ReportDefinitionError(`معامل مقارنة غير مسموح: "${spec.op}"`);
      }
      let bound = this.checkScalar(value, key);
      if (spec.op === "like" || spec.op === "ilike") {
        if (typeof bound !== "string") {
          throw new ReportDefinitionError(`الفلتر "${key}" مع ${spec.op} يتطلب نصاً`);
        }
        bound = `%${bound}%`;
      }
      whereClauses.push(`"${column}" ${sqlOp} ${addValue(bound)}`);
    }

    // 7) الترتيب
    const orderByRaw = def.orderBy ?? [];
    if (!Array.isArray(orderByRaw)) {
      throw new ReportDefinitionError("orderBy يجب أن يكون مصفوفة");
    }
    if (orderByRaw.length > 5) {
      throw new ReportDefinitionError("عدد حقول الترتيب يتجاوز الحد الأقصى (5)");
    }
    const orderClauses: string[] = [];
    for (const [i, raw] of orderByRaw.entries()) {
      const item = this.assertObject(raw, `عنصر الترتيب رقم ${i + 1}`);
      const field = String(item.field ?? "");
      assertSafeIdentifier(field, "حقل الترتيب");
      if (!fields.includes(field) && !aggAliases.has(field)) {
        throw new ReportDefinitionError(
          `حقل الترتيب "${field}" يجب أن يكون ضمن fields أو أسماء النتائج التجميعية`
        );
      }
      const dir = String(item.dir ?? "asc").toLowerCase();
      if (dir !== "asc" && dir !== "desc") {
        throw new ReportDefinitionError(`اتجاه ترتيب غير صالح: "${String(item.dir)}"`);
      }
      orderClauses.push(`"${field}" ${dir.toUpperCase()}`);
    }

    // 8) الحد الأقصى للصفوف
    const requestedLimit =
      def.limit === undefined ? this.resolveMaxRows(options.maxRows) : Number(def.limit);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      throw new ReportDefinitionError("limit يجب أن يكون عدداً صحيحاً موجباً");
    }
    const limit = Math.min(requestedLimit, this.resolveMaxRows(options.maxRows));

    // 9) تجميع SQL
    const selectList = [
      ...fields.map((f) => `"${f}"`),
      ...aggSelects,
    ].join(", ");

    const sqlParts = [`SELECT ${selectList} FROM "${table}"`];
    if (whereClauses.length > 0) {
      sqlParts.push(`WHERE ${whereClauses.join(" AND ")}`);
    }
    if (groupBy.length > 0) {
      sqlParts.push(`GROUP BY ${groupBy.map((g) => `"${g}"`).join(", ")}`);
    }
    if (orderClauses.length > 0) {
      sqlParts.push(`ORDER BY ${orderClauses.join(", ")}`);
    }
    sqlParts.push(`LIMIT ${addValue(limit)}`);

    const columns = [...fields, ...Array.from(aggAliases)];

    return { sql: sqlParts.join(" "), params, columns, limit };
  }

  /** ينفّذ التقرير فعلياً على قاعدة البيانات ويعيد صفوفاً حقيقية. */
  static async execute(definition: unknown, options: EngineOptions = {}): Promise<EngineResult> {
    const built = await this.build(definition, options);
    const timeoutMs = this.resolveTimeout(options.timeoutMs);
    const started = Date.now();

    const rawRows = await prisma.$transaction(
      async (tx) => {
        // SET LOCAL لا يقبل معامِلات؛ القيمة عدد صحيح متحقق منه.
        await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${timeoutMs}`);
        return tx.$queryRawUnsafe<Array<Record<string, unknown>>>(built.sql, ...built.params);
      },
      { timeout: timeoutMs + 5000, maxWait: 5000 }
    );

    const rows = rawRows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        out[k] = typeof v === "bigint" ? Number(v) : v;
      }
      return out;
    });

    return {
      columns: rows.length > 0 ? Object.keys(rows[0]) : built.columns,
      rows,
      rowCount: rows.length,
      truncated: rows.length >= built.limit,
      sql: built.sql,
      paramCount: built.params.length,
      executionTimeMs: Date.now() - started,
    };
  }

  // ---------------------------------------------------------------- helpers

  private static resolveMaxRows(maxRows?: number): number {
    if (maxRows === undefined) return DEFAULT_MAX_ROWS;
    if (!Number.isInteger(maxRows) || maxRows < 1) {
      throw new ReportDefinitionError("maxRows غير صالح");
    }
    return Math.min(maxRows, HARD_MAX_ROWS);
  }

  private static resolveTimeout(timeoutMs?: number): number {
    if (timeoutMs === undefined) return DEFAULT_TIMEOUT_MS;
    if (!Number.isInteger(timeoutMs) || timeoutMs < 100) {
      throw new ReportDefinitionError("timeoutMs غير صالح");
    }
    return Math.min(timeoutMs, DEFAULT_TIMEOUT_MS);
  }

  private static assertObject(value: unknown, label: string): Record<string, any> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ReportDefinitionError(`${label} يجب أن يكون كائناً (object)`);
    }
    return value as Record<string, any>;
  }

  private static isScalar(value: unknown): value is Scalar {
    return (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  }

  private static checkScalar(value: unknown, label: string): Scalar {
    if (!this.isScalar(value)) {
      throw new ReportDefinitionError(`قيمة الفلتر "${label}" يجب أن تكون قيمة مفردة`);
    }
    if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
      throw new ReportDefinitionError(
        `قيمة الفلتر "${label}" تتجاوز ${MAX_STRING_LENGTH} حرفاً`
      );
    }
    return value;
  }

  private static normalizeFilter(raw: unknown): FilterSpec {
    if (Array.isArray(raw)) {
      return { op: "in", value: raw };
    }
    if (this.isScalar(raw)) {
      return { op: "eq", value: raw };
    }
    const obj = this.assertObject(raw, "الفلتر");
    const op = String(obj.op ?? "eq").toLowerCase();
    if (!("value" in obj) && op !== "isNull") {
      throw new ReportDefinitionError(`الفلتر بصيغة الكائن يتطلب حقل value`);
    }
    return { op, value: obj.value };
  }
}
