import { prisma } from "../lib/prisma";
import { conflict, notFound, unprocessable } from "../lib/httpError";

/**
 * ADR-008 — خدمة عامة للبيانات المرجعية الخمسة.
 *
 * الأنماط مطابقة لـADR-007 (country/job):
 * - Hard delete + عدّ المراجع تطبيقياً → 422.
 * - قفل تفاؤلي عبر `version` → 409.
 * - سجل تدقيق موحّد `reference_data_audit_log`.
 * - فريدية الاسم/الكود غير حساسة لحالة الأحرف.
 */

export type ReferenceEntityType =
  | "salary_grade"
  | "cadre"
  | "classification"
  | "position_type"
  | "salary_source";

export interface Actor {
  userId: number;
  username: string;
  role: string;
}

export interface ReferenceFilter {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ReferenceUsage {
  label: string;
  count: number;
}

interface EntityConfig {
  entityType: ReferenceEntityType;
  delegate: string;
  label: string;
  fields: string[];
  /** أعمدة تدخل في سجل التدقيق. */
  auditFields: string[];
  /** دالة عدّ المراجع — ترجع [] إذا لا توجد مراجع. */
  usage: (id: number) => Promise<ReferenceUsage[]>;
}

async function noUsage(): Promise<ReferenceUsage[]> {
  return [];
}

const CONFIGS: Record<ReferenceEntityType, EntityConfig> = {
  salary_grade: {
    entityType: "salary_grade",
    delegate: "salaryGrade",
    label: "درجة الراتب",
    fields: [
      "name",
      "code",
      "description",
      "startSalary",
      "endSalary",
      "midpointSalary",
      "notes",
    ],
    auditFields: [
      "name",
      "code",
      "description",
      "startSalary",
      "endSalary",
      "midpointSalary",
      "notes",
      "version",
    ],
    usage: async (id) => [
      { label: "وظائف", count: await prisma.job.count({ where: { salaryGradeId: id } }) },
    ],
  },
  cadre: {
    entityType: "cadre",
    delegate: "cadre",
    label: "الفئة الوظيفية",
    fields: ["name", "code", "description"],
    auditFields: ["name", "code", "description", "version"],
    usage: async (id) => [
      { label: "وظائف", count: await prisma.job.count({ where: { cadreId: id } }) },
    ],
  },
  classification: {
    entityType: "classification",
    delegate: "classification",
    label: "التصنيف الوظيفي",
    fields: ["name", "code", "description"],
    auditFields: ["name", "code", "description", "version"],
    usage: async (id) => [
      {
        label: "وظائف",
        count: await prisma.job.count({ where: { classificationId: id } }),
      },
    ],
  },
  position_type: {
    entityType: "position_type",
    delegate: "jobType",
    label: "نوع الوظيفة",
    fields: ["name", "code", "description"],
    auditFields: ["name", "code", "description", "version"],
    usage: async (id) => [
      { label: "مناصب", count: await prisma.position.count({ where: { posTypeId: id } }) },
    ],
  },
  salary_source: {
    entityType: "salary_source",
    delegate: "salarySource",
    label: "مصدر الراتب",
    fields: ["name", "code", "description"],
    auditFields: ["name", "code", "description", "version"],
    // ADR-008 §8.5: لا FK من positions.source — الحذف مسموح.
    usage: noUsage,
  },
};

function getConfig(entityType: ReferenceEntityType): EntityConfig {
  const config = CONFIGS[entityType];
  if (!config) throw notFound("نوع البيانات المرجعية غير معروف");
  return config;
}

function delegateFor(config: EntityConfig): any {
  return (prisma as any)[config.delegate];
}

function toPublic(config: EntityConfig, record: any) {
  const result: Record<string, unknown> = {
    id: record.id,
    version: record.version,
    createdAt: record.createdAt,
  };
  for (const field of config.fields) {
    result[field] = record[field] ?? null;
  }
  return result;
}

function auditValues(config: EntityConfig, record: any) {
  const values: Record<string, unknown> = { id: record.id };
  for (const field of config.auditFields) {
    values[field] = record[field] ?? null;
  }
  return values;
}

async function writeAudit(
  tx: any,
  entry: {
    entityType: ReferenceEntityType;
    entityId: number;
    action: "create" | "update" | "delete";
    changedBy: number;
    oldValues?: unknown;
    newValues?: unknown;
    reason?: string | null;
  }
): Promise<void> {
  const data: any = {
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    changedBy: entry.changedBy,
  };
  if (entry.oldValues !== undefined) data.oldValues = entry.oldValues;
  if (entry.newValues !== undefined) data.newValues = entry.newValues;
  if (entry.reason) data.reason = entry.reason;

  await tx.referenceDataAuditLog.create({ data });
}

async function assertUniqueName(config: EntityConfig, name: string, excludeId?: number) {
  const duplicate = await delegateFor(config).findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });
  if (duplicate) {
    throw conflict(`${config.label}: يوجد سجل آخر بالاسم نفسه`);
  }
}

async function assertUniqueCode(
  config: EntityConfig,
  code: string | null,
  excludeId?: number
) {
  if (!code) return;
  const duplicate = await delegateFor(config).findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });
  if (duplicate) {
    throw conflict(`${config.label}: يوجد سجل آخر بالكود نفسه`);
  }
}

function normalizeInput(config: EntityConfig, input: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (input[field] === undefined) continue;
    const value = input[field];
    // الحقول النصية الاختيارية: السلسلة الفارغة تُطبَّع إلى null.
    if (typeof value === "string") {
      const trimmed = value.trim();
      data[field] = trimmed === "" ? null : trimmed;
    } else {
      data[field] = value;
    }
  }
  return data;
}

export class ReferenceDataService {
  static config(entityType: ReferenceEntityType) {
    return getConfig(entityType);
  }

  static async list(entityType: ReferenceEntityType, filter: ReferenceFilter = {}) {
    const config = getConfig(entityType);
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit =
      filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { code: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const delegate = delegateFor(config);
    const [data, total] = await prisma.$transaction([
      delegate.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
      delegate.count({ where }),
    ]);

    return {
      data: data.map((record: any) => toPublic(config, record)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(entityType: ReferenceEntityType, id: number) {
    const config = getConfig(entityType);
    const record = await delegateFor(config).findUnique({ where: { id } });
    if (!record) throw notFound(`${config.label} غير موجود`);
    return toPublic(config, record);
  }

  static async create(
    entityType: ReferenceEntityType,
    input: Record<string, unknown>,
    actor: Actor
  ) {
    const config = getConfig(entityType);
    const data = normalizeInput(config, input);

    await assertUniqueName(config, String(data.name));
    await assertUniqueCode(config, (data.code as string | null) ?? null);

    const created = await prisma.$transaction(async (tx: any) => {
      const record = await (tx as any)[config.delegate].create({ data });

      await writeAudit(tx, {
        entityType,
        entityId: record.id,
        action: "create",
        changedBy: actor.userId,
        newValues: auditValues(config, record),
      });

      return record;
    });

    return toPublic(config, created);
  }

  static async update(
    entityType: ReferenceEntityType,
    id: number,
    input: Record<string, unknown>,
    actor: Actor
  ) {
    const config = getConfig(entityType);
    const delegate = delegateFor(config);
    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) throw notFound(`${config.label} غير موجود`);

    const data = normalizeInput(config, input);

    if (data.name !== undefined && data.name !== existing.name) {
      await assertUniqueName(config, String(data.name), id);
    }
    if (data.code !== undefined && data.code !== null && data.code !== existing.code) {
      await assertUniqueCode(config, data.code as string, id);
    }

    const version = input.version as number;

    const updated = await prisma.$transaction(async (tx: any) => {
      const result = await (tx as any)[config.delegate].updateMany({
        where: { id, version },
        data: { ...data, version: { increment: 1 } },
      });

      if (result.count === 0) {
        throw conflict(
          "تعارض في الإصدار (version): السجل عُدِّل بواسطة مستخدم آخر. أعد تحميل البيانات ثم حاول مجدداً"
        );
      }

      const fresh = await (tx as any)[config.delegate].findUniqueOrThrow({ where: { id } });

      await writeAudit(tx, {
        entityType,
        entityId: id,
        action: "update",
        changedBy: actor.userId,
        oldValues: auditValues(config, existing),
        newValues: auditValues(config, fresh),
      });

      return fresh;
    });

    return toPublic(config, updated);
  }

  static async delete(entityType: ReferenceEntityType, id: number, actor: Actor) {
    const config = getConfig(entityType);
    const delegate = delegateFor(config);
    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) throw notFound(`${config.label} غير موجود`);

    const usage = await config.usage(id);
    const total = usage.reduce((sum, item) => sum + item.count, 0);

    if (total > 0) {
      const details = usage.reduce<Record<string, number>>((acc, item) => {
        acc[item.label] = item.count;
        return acc;
      }, {});
      throw unprocessable(
        `لا يمكن حذف ${config.label}: يوجد ${total} سجل مرتبط به. ` +
          "أزل المراجع أولاً ثم أعد المحاولة.",
        details
      );
    }

    try {
      await prisma.$transaction(async (tx: any) => {
        await writeAudit(tx, {
          entityType,
          entityId: id,
          action: "delete",
          changedBy: actor.userId,
          oldValues: auditValues(config, existing),
        });
        await (tx as any)[config.delegate].delete({ where: { id } });
      });
    } catch (error: any) {
      // شبكة أمان: أي FK لم يُحسب تطبيقياً (P2003).
      if (error?.code === "P2003") {
        throw unprocessable(
          `لا يمكن حذف ${config.label}: يوجد سجل مرتبط به. أزل المراجع أولاً ثم أعد المحاولة.`
        );
      }
      throw error;
    }

    return { success: true, id };
  }
}
