import { prisma } from "../lib/prisma";
import { badRequest, conflict, notFound, unprocessable } from "../lib/httpError";

/**
 * ADR-007 — إدارة المسميات الوظيفية (بيانات مرجعية).
 * Hard delete + قفل تفاؤلي (version) + audit + حماية positions (422)
 * + cascade مرجعي (salaryGrade / cadre / classification).
 */

export interface JobCreateInput {
  title: string;
  code?: string | null;
  description?: string | null;
  salaryGradeId?: number | null;
  cadreId?: number | null;
  classificationId?: number | null;
}

export interface JobUpdateInput {
  version: number;
  title?: string;
  code?: string | null;
  description?: string | null;
  salaryGradeId?: number | null;
  cadreId?: number | null;
  classificationId?: number | null;
}

export interface JobFilter {
  page?: number;
  limit?: number;
  search?: string;
}

export interface Actor {
  userId: number;
  username: string;
  role: string;
}

const LIST_INCLUDE = {
  salaryGrade: true,
  cadre: true,
  classification: true,
  _count: { select: { positions: true } },
} as const;

function ref(row: any) {
  return row ? { id: row.id, name: row.name } : null;
}

/**
 * GAP-M-004: تفاصيل الوظيفة تشمل المناصب التابعة لها.
 * `positions` لا تُحمَّل في القائمة (أداء) — فقط في getById.
 */
const DETAIL_INCLUDE = {
  ...LIST_INCLUDE,
  positions: {
    include: {
      posType: true,
      status: true,
      facility: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { id: "asc" as const },
  },
} as const;

function toPublic(job: any) {
  return {
    id: job.id,
    title: job.title,
    code: job.code ?? null,
    description: job.description ?? null,
    salaryGradeId: job.salaryGradeId ?? null,
    cadreId: job.cadreId ?? null,
    classificationId: job.classificationId ?? null,
    salaryGrade: ref(job.salaryGrade),
    cadre: ref(job.cadre),
    classification: ref(job.classification),
    version: job.version,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    positionsCount:
      job._count?.positions ??
      (Array.isArray(job.positions) ? job.positions.length : 0),
    ...(Array.isArray(job.positions) && {
      positions: job.positions.map((position: any) => ({
        id: position.id,
        code: position.code ?? null,
        title: position.title ?? null,
        description: position.description ?? null,
        proposedSalary: position.proposedSalary ?? null,
        source: position.source ?? null,
        posTypeId: position.posTypeId ?? null,
        posType: position.posType ? { id: position.posType.id, name: position.posType.name } : null,
        statusId: position.statusId ?? null,
        status: position.status ? { id: position.status.id, name: position.status.name } : null,
        facilityId: position.facilityId ?? null,
        facility: position.facility ?? null,
        departmentId: position.departmentId ?? null,
        department: position.department ?? null,
        proposedHiringDate: position.proposedHiringDate ?? null,
        proposedEndDate: position.proposedEndDate ?? null,
        postedDate: position.postedDate ?? null,
        comments: position.comments ?? null,
      })),
    }),
  };
}

function auditValues(job: any) {
  return {
    title: job.title,
    code: job.code ?? null,
    description: job.description ?? null,
    salaryGradeId: job.salaryGradeId ?? null,
    cadreId: job.cadreId ?? null,
    classificationId: job.classificationId ?? null,
    version: job.version,
  };
}

async function writeAudit(
  tx: any,
  entry: {
    jobId: number;
    action: "create" | "update" | "delete";
    changedBy: number;
    oldValues?: unknown;
    newValues?: unknown;
    reason?: string | null;
  }
): Promise<void> {
  const data: any = {
    jobId: entry.jobId,
    action: entry.action,
    changedBy: entry.changedBy,
  };
  if (entry.oldValues !== undefined) data.oldValues = entry.oldValues;
  if (entry.newValues !== undefined) data.newValues = entry.newValues;
  if (entry.reason) data.reason = entry.reason;

  await tx.jobAuditLog.create({ data });
}

async function assertUniqueTitle(title: string, excludeId?: number) {
  const duplicate = await prisma.job.findFirst({
    where: {
      title: { equals: title, mode: "insensitive" },
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });
  if (duplicate) throw conflict("يوجد مسمى وظيفي آخر بنفس الاسم");
}

/** ADR-007: التحقق من وجود المراجع الثلاثة (BR-044/045/046). */
async function assertReferences(input: {
  salaryGradeId?: number | null;
  cadreId?: number | null;
  classificationId?: number | null;
}) {
  const checks: Promise<unknown>[] = [];
  const missing: string[] = [];

  if (input.salaryGradeId !== undefined && input.salaryGradeId !== null) {
    checks.push(
      prisma.salaryGrade
        .findUnique({ where: { id: input.salaryGradeId } })
        .then((row) => {
          if (!row) missing.push("درجة الراتب");
        })
    );
  }
  if (input.cadreId !== undefined && input.cadreId !== null) {
    checks.push(
      prisma.cadre.findUnique({ where: { id: input.cadreId } }).then((row) => {
        if (!row) missing.push("الفئة الوظيفية");
      })
    );
  }
  if (input.classificationId !== undefined && input.classificationId !== null) {
    checks.push(
      prisma.classification
        .findUnique({ where: { id: input.classificationId } })
        .then((row) => {
          if (!row) missing.push("التصنيف الوظيفي");
        })
    );
  }

  await Promise.all(checks);

  if (missing.length) {
    throw badRequest(`المرجع المحدد غير موجود: ${missing.join(", ")}`);
  }
}

export class JobService {
  static async list(filter: JobFilter = {}) {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit =
      filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: "insensitive" } },
        { code: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: "asc" },
        include: LIST_INCLUDE,
      }),
      prisma.job.count({ where }),
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
    const job = await prisma.job.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!job) throw notFound("المسمى الوظيفي غير موجود");
    return toPublic(job);
  }

  static async create(input: JobCreateInput, actor: Actor) {
    await assertUniqueTitle(input.title);
    await assertReferences(input);

    const created = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          title: input.title,
          code: input.code ?? null,
          description: input.description ?? null,
          salaryGradeId: input.salaryGradeId ?? null,
          cadreId: input.cadreId ?? null,
          classificationId: input.classificationId ?? null,
        },
        include: LIST_INCLUDE,
      });

      await writeAudit(tx, {
        jobId: job.id,
        action: "create",
        changedBy: actor.userId,
        newValues: auditValues(job),
      });

      return job;
    });

    return toPublic(created);
  }

  static async update(id: number, input: JobUpdateInput, actor: Actor) {
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) throw notFound("المسمى الوظيفي غير موجود");

    if (input.title !== undefined && input.title !== existing.title) {
      await assertUniqueTitle(input.title, id);
    }
    await assertReferences(input);

    const updated = await prisma.$transaction(async (tx) => {
      const data: any = { version: { increment: 1 } };
      if (input.title !== undefined) data.title = input.title;
      if (input.code !== undefined) data.code = input.code;
      if (input.description !== undefined) data.description = input.description;
      if (input.salaryGradeId !== undefined)
        data.salaryGradeId = input.salaryGradeId;
      if (input.cadreId !== undefined) data.cadreId = input.cadreId;
      if (input.classificationId !== undefined)
        data.classificationId = input.classificationId;

      const result = await tx.job.updateMany({
        where: { id, version: input.version },
        data,
      });

      if (result.count === 0) {
        throw conflict(
          "تعارض في النسخة (version): عُدِّل المسمى الوظيفي من جلسة أخرى. أعد تحميل البيانات وحاول مجدداً"
        );
      }

      const fresh = await tx.job.findUniqueOrThrow({
        where: { id },
        include: LIST_INCLUDE,
      });

      await writeAudit(tx, {
        jobId: id,
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
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) throw notFound("المسمى الوظيفي غير موجود");

    const positionsCount = await prisma.position.count({ where: { jobId: id } });
    if (positionsCount > 0) {
      throw unprocessable(
        `لا يمكن حذف المسمى الوظيفي: توجد ${positionsCount} وظيفة شاغرة مرتبطة به. ` +
          "أعد ربط الوظائف أو احذفها أولاً.",
        { positionsCount }
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        await writeAudit(tx, {
          jobId: id,
          action: "delete",
          changedBy: actor.userId,
          oldValues: auditValues(existing),
        });
        await tx.job.delete({ where: { id } });
      });
    } catch (error: any) {
      if (error?.code === "P2003") {
        throw unprocessable(
          "لا يمكن حذف المسمى الوظيفي: توجد سجلات مرتبطة به. أعد ربط الوظائف أو احذفها أولاً."
        );
      }
      throw error;
    }

    return { success: true, id };
  }

  // ------------------------------------------------------------
  // بيانات مرجعية للـcascade (ADR-007 §7.2 البند 5)
  // ------------------------------------------------------------

  static async salaryGrades() {
    return prisma.salaryGrade.findMany({ orderBy: { name: "asc" } });
  }

  static async cadres() {
    return prisma.cadre.findMany({ orderBy: { name: "asc" } });
  }

  static async classifications() {
    return prisma.classification.findMany({ orderBy: { name: "asc" } });
  }
}
