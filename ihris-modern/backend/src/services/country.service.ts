import { prisma } from "../lib/prisma";
import { conflict, notFound, unprocessable } from "../lib/httpError";

/**
 * ADR-007 — إدارة الدول (بيانات مرجعية).
 * Hard delete + قفل تفاؤلي (version) + audit + حماية مراجع (422).
 */

export interface CountryCreateInput {
  name: string;
  code?: string | null;
}

export interface CountryUpdateInput {
  version: number;
  name?: string;
  code?: string | null;
}

export interface CountryFilter {
  page?: number;
  limit?: number;
  search?: string;
}

export interface Actor {
  userId: number;
  username: string;
  role: string;
}

function toPublic(country: any) {
  return {
    id: country.id,
    name: country.name,
    code: country.code ?? null,
    version: country.version,
    createdAt: country.createdAt,
  };
}

function auditValues(country: any) {
  return {
    name: country.name,
    code: country.code ?? null,
    version: country.version,
  };
}

async function writeAudit(
  tx: any,
  entry: {
    countryId: number;
    action: "create" | "update" | "delete";
    changedBy: number;
    oldValues?: unknown;
    newValues?: unknown;
    reason?: string | null;
  }
): Promise<void> {
  const data: any = {
    countryId: entry.countryId,
    action: entry.action,
    changedBy: entry.changedBy,
  };
  if (entry.oldValues !== undefined) data.oldValues = entry.oldValues;
  if (entry.newValues !== undefined) data.newValues = entry.newValues;
  if (entry.reason) data.reason = entry.reason;

  await tx.countryAuditLog.create({ data });
}

async function assertUniqueName(name: string, excludeId?: number) {
  const duplicate = await prisma.country.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });
  if (duplicate) throw conflict("توجد دولة أخرى بنفس الاسم");
}

async function assertUniqueCode(code: string, excludeId?: number) {
  const duplicate = await prisma.country.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });
  if (duplicate) throw conflict("توجد دولة أخرى بنفس الكود");
}

/**
 * ADR-007 §7.3: عدّ كل المراجع قبل الحذف.
 * ملاحظة: nationalityId / residenceCountryId / scheduled_training_courses.countryId
 * بلا FK في قاعدة البيانات، لذا الفحص التطبيقي ضروري لمنع قيم معلّقة.
 */
async function referenceCounts(countryId: number) {
  const [
    districts,
    facilities,
    peopleCountry,
    peopleNationality,
    peopleResidence,
    scheduledCourses,
  ] = await Promise.all([
    prisma.district.count({ where: { countryId } }),
    prisma.facility.count({ where: { countryId } }),
    prisma.person.count({ where: { countryId } }),
    prisma.person.count({ where: { nationalityId: countryId } }),
    prisma.person.count({ where: { residenceCountryId: countryId } }),
    prisma.scheduledTrainingCourse.count({ where: { countryId } }),
  ]);

  return {
    districts,
    facilities,
    peopleCountry,
    peopleNationality,
    peopleResidence,
    scheduledCourses,
  };
}

export class CountryService {
  static async list(filter: CountryFilter = {}) {
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

    const [data, total] = await prisma.$transaction([
      prisma.country.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.country.count({ where }),
    ]);

    return {
      data: data.map(toPublic),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: number) {
    const country = await prisma.country.findUnique({ where: { id } });
    if (!country) throw notFound("الدولة غير موجودة");
    return toPublic(country);
  }

  static async create(input: CountryCreateInput, actor: Actor) {
    await assertUniqueName(input.name);
    const code = input.code ?? null;
    if (code) await assertUniqueCode(code);

    const created = await prisma.$transaction(async (tx) => {
      const country = await tx.country.create({
        data: { name: input.name, code },
      });

      await writeAudit(tx, {
        countryId: country.id,
        action: "create",
        changedBy: actor.userId,
        newValues: auditValues(country),
      });

      return country;
    });

    return toPublic(created);
  }

  static async update(id: number, input: CountryUpdateInput, actor: Actor) {
    const existing = await prisma.country.findUnique({ where: { id } });
    if (!existing) throw notFound("الدولة غير موجودة");

    if (input.name !== undefined && input.name !== existing.name) {
      await assertUniqueName(input.name, id);
    }
    if (input.code !== undefined && input.code !== null) {
      if (input.code !== existing.code) await assertUniqueCode(input.code, id);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const data: any = { version: { increment: 1 } };
      if (input.name !== undefined) data.name = input.name;
      if (input.code !== undefined) data.code = input.code;

      const result = await tx.country.updateMany({
        where: { id, version: input.version },
        data,
      });

      if (result.count === 0) {
        throw conflict(
          "تعارض في النسخة (version): عُدِّلت الدولة من جلسة أخرى. أعد تحميل البيانات وحاول مجدداً"
        );
      }

      const fresh = await tx.country.findUniqueOrThrow({ where: { id } });

      await writeAudit(tx, {
        countryId: id,
        action: "update",
        changedBy: actor.userId,
        oldValues: auditValues(existing),
        newValues: auditValues(fresh),
      });

      return fresh;
    });

    return toPublic(updated);
  }

  static async delete(id: number, actor: Actor) {
    const existing = await prisma.country.findUnique({ where: { id } });
    if (!existing) throw notFound("الدولة غير موجودة");

    const counts = await referenceCounts(id);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

    if (total > 0) {
      throw unprocessable(
        `لا يمكن حذف الدولة: توجد ${total} مرجع/مراجع مرتبطة بها ` +
          "(محافظات، منشآت، أشخاص، تدريب). احذف أو أعد ربط المراجع أولاً.",
        counts
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        await writeAudit(tx, {
          countryId: id,
          action: "delete",
          changedBy: actor.userId,
          oldValues: auditValues(existing),
        });
        await tx.country.delete({ where: { id } });
      });
    } catch (error: any) {
      // شبكة أمان للسباق: قيد FK من districts
      if (error?.code === "P2003") {
        throw unprocessable(
          "لا يمكن حذف الدولة: توجد سجلات مرتبطة بها. احذف أو أعد ربط المراجع أولاً."
        );
      }
      throw error;
    }

    return { success: true, id };
  }
}
