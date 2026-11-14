import { prisma } from "../lib/prisma";
import { conflict, notFound, unprocessable } from "../lib/httpError";

/**
 * ADR-009 — خدمة وحدة التدريب.
 *
 * الأنماط مطابقة لـADR-007/008:
 * - قفل تفاؤلي عبر `version` → 409.
 * - Soft delete للدورات، Hard للمؤسسات مع عدّ المراجع → 422.
 * - سجل تدقيق موحّد `training_audit_log`.
 * - منع التسجيل بعد إتمام الدورة، ومنع حذف دورة مجدولة بها متدربون.
 */

export interface Actor {
  userId: number;
  username: string;
  role: string;
}

export interface TrainingCourseInput {
  name?: string;
  topic?: string | null;
  notes?: string | null;
  trainingInstitutionId?: number | null;
  trainingFunder?: string | null;
  continuingEducationCourse?: string | null;
  trainingCourseStatusId?: number | null;
  trainingCourseCategoryId?: number | null;
  competency?: string | null;
}

export interface ScheduledCourseInput {
  trainingCourseId?: number;
  site?: string | null;
  numStudents?: number | null;
  notes?: string | null;
  instructors?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  countryId?: number | null;
  districtId?: number | null;
  countyId?: number | null;
  status?: string;
}

export interface EnrollmentInput {
  personId?: number;
  notes?: string | null;
  isRetraining?: boolean;
  trainingCourseEvaluationId?: number | null;
  trainingCourseRequestorId?: number | null;
  completed?: boolean;
}

const courseInclude = {
  trainingInstitution: true,
  trainingCourseStatus: true,
  trainingCourseCategory: true,
  scheduledCourses: {
    include: {
      personScheduled: { include: { person: true } },
    },
  },
} as const;

const scheduledInclude = {
  trainingCourse: { include: { trainingInstitution: true } },
  personScheduled: { include: { person: true } },
} as const;

const STATUS_TRANSITIONS: Record<string, string[]> = {
  planning: ["scheduled", "cancelled"],
  scheduled: ["completed", "cancelled", "planning"],
  completed: [],
  cancelled: ["planning"],
};

function toDate(value: string | Date | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
}

function courseAudit(record: any) {
  return {
    id: record.id,
    name: record.name,
    topic: record.topic ?? null,
    trainingInstitutionId: record.trainingInstitutionId ?? null,
    trainingCourseStatusId: record.trainingCourseStatusId ?? null,
    trainingCourseCategoryId: record.trainingCourseCategoryId ?? null,
    competency: record.competency ?? null,
    version: record.version,
    deletedAt: record.deletedAt ?? null,
  };
}

function institutionAudit(record: any) {
  return { id: record.id, name: record.name, version: record.version };
}

function scheduledAudit(record: any) {
  return {
    id: record.id,
    trainingCourseId: record.trainingCourseId,
    site: record.site ?? null,
    numStudents: record.numStudents ?? null,
    instructors: record.instructors ?? null,
    startDate: record.startDate ?? null,
    endDate: record.endDate ?? null,
    status: record.status,
    version: record.version,
  };
}

function enrollmentAudit(record: any) {
  return {
    id: record.id,
    personId: record.personId,
    scheduledTrainingCourseId: record.scheduledTrainingCourseId,
    completed: record.completed,
    isRetraining: record.isRetraining,
    notes: record.notes ?? null,
  };
}

async function writeAudit(
  tx: any,
  entry: {
    entityType: string;
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
  await tx.trainingAuditLog.create({ data });
}

async function assertUniqueCourseName(name: string, excludeId?: number) {
  const duplicate = await prisma.trainingCourse.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deletedAt: null,
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });
  if (duplicate) throw conflict("توجد دورة تدريبية أخرى بالاسم نفسه");
}

async function assertUniqueInstitutionName(name: string, excludeId?: number) {
  const duplicate = await prisma.trainingInstitution.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });
  if (duplicate) throw conflict("توجد مؤسسة تدريبية أخرى بالاسم نفسه");
}

async function assertCourseReferences(input: TrainingCourseInput) {
  if (input.trainingInstitutionId !== undefined && input.trainingInstitutionId !== null) {
    const found = await prisma.trainingInstitution.findUnique({
      where: { id: input.trainingInstitutionId },
    });
    if (!found) throw unprocessable("المؤسسة التدريبية غير موجودة");
  }
  if (input.trainingCourseStatusId !== undefined && input.trainingCourseStatusId !== null) {
    const found = await prisma.trainingCourseStatus.findUnique({
      where: { id: input.trainingCourseStatusId },
    });
    if (!found) throw unprocessable("حالة الدورة غير موجودة");
  }
  if (
    input.trainingCourseCategoryId !== undefined &&
    input.trainingCourseCategoryId !== null
  ) {
    const found = await prisma.trainingCourseCategory.findUnique({
      where: { id: input.trainingCourseCategoryId },
    });
    if (!found) throw unprocessable("تصنيف الدورة غير موجود");
  }
}

export class TrainingService {
  // ---------------------------------------------------------------- courses
  static async listCourses(options: { search?: string; includeDeleted?: boolean } = {}) {
    const where: any = {};
    if (!options.includeDeleted) where.deletedAt = null;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { topic: { contains: options.search, mode: "insensitive" } },
      ];
    }
    return prisma.trainingCourse.findMany({
      where,
      include: courseInclude,
      orderBy: { name: "asc" },
    });
  }

  static async getCourse(id: number) {
    const course = await prisma.trainingCourse.findFirst({
      where: { id, deletedAt: null },
      include: courseInclude,
    });
    if (!course) throw notFound("الدورة التدريبية غير موجودة");
    return course;
  }

  static async createCourse(data: TrainingCourseInput, actor: Actor) {
    await assertUniqueCourseName(String(data.name));
    await assertCourseReferences(data);

    const created = await prisma.$transaction(async (tx: any) => {
      const record = await tx.trainingCourse.create({
        data: {
          name: data.name,
          topic: data.topic ?? null,
          notes: data.notes ?? null,
          trainingInstitutionId: data.trainingInstitutionId ?? null,
          trainingFunder: data.trainingFunder ?? null,
          continuingEducationCourse: data.continuingEducationCourse ?? null,
          trainingCourseStatusId: data.trainingCourseStatusId ?? null,
          trainingCourseCategoryId: data.trainingCourseCategoryId ?? null,
          competency: data.competency ?? null,
        },
      });
      await writeAudit(tx, {
        entityType: "course",
        entityId: record.id,
        action: "create",
        changedBy: actor.userId,
        newValues: courseAudit(record),
      });
      return record;
    });

    return created;
  }

  static async updateCourse(id: number, input: TrainingCourseInput & { version: number }, actor: Actor) {
    const existing = await prisma.trainingCourse.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw notFound("الدورة التدريبية غير موجودة");

    if (input.name !== undefined && input.name !== existing.name) {
      await assertUniqueCourseName(input.name, id);
    }
    await assertCourseReferences(input);

    const { version, ...data } = input;

    const updated = await prisma.$transaction(async (tx: any) => {
      const result = await tx.trainingCourse.updateMany({
        where: { id, version, deletedAt: null },
        data: { ...data, version: { increment: 1 } },
      });
      if (result.count === 0) {
        throw conflict(
          "تعارض في الإصدار (version): السجل عُدِّل بواسطة مستخدم آخر. أعد تحميل البيانات ثم حاول مجدداً"
        );
      }
      const fresh = await tx.trainingCourse.findUniqueOrThrow({ where: { id } });
      await writeAudit(tx, {
        entityType: "course",
        entityId: id,
        action: "update",
        changedBy: actor.userId,
        oldValues: courseAudit(existing),
        newValues: courseAudit(fresh),
      });
      return fresh;
    });

    return updated;
  }

  static async deleteCourse(id: number, actor: Actor) {
    const existing = await prisma.trainingCourse.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw notFound("الدورة التدريبية غير موجودة");

    const scheduled = await prisma.scheduledTrainingCourse.count({
      where: { trainingCourseId: id },
    });
    if (scheduled > 0) {
      throw unprocessable(
        `لا يمكن حذف الدورة: يوجد ${scheduled} دورة مجدولة مرتبطة بها. احذف الدورات المجدولة أولاً.`,
        { scheduledCourses: scheduled }
      );
    }

    await prisma.$transaction(async (tx: any) => {
      await writeAudit(tx, {
        entityType: "course",
        entityId: id,
        action: "delete",
        changedBy: actor.userId,
        oldValues: courseAudit(existing),
      });
      await tx.trainingCourse.update({
        where: { id },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });
    });

    return { success: true, id, softDeleted: true };
  }

  // ---------------------------------------------------------------- institutions
  static async listInstitutions(options: { search?: string } = {}) {
    const where: any = {};
    if (options.search) {
      where.name = { contains: options.search, mode: "insensitive" };
    }
    return prisma.trainingInstitution.findMany({ where, orderBy: { name: "asc" } });
  }

  static async getInstitution(id: number) {
    const institution = await prisma.trainingInstitution.findUnique({ where: { id } });
    if (!institution) throw notFound("المؤسسة التدريبية غير موجودة");
    return institution;
  }

  static async createInstitution(name: string, actor: Actor) {
    await assertUniqueInstitutionName(name);
    const created = await prisma.$transaction(async (tx: any) => {
      const record = await tx.trainingInstitution.create({ data: { name } });
      await writeAudit(tx, {
        entityType: "institution",
        entityId: record.id,
        action: "create",
        changedBy: actor.userId,
        newValues: institutionAudit(record),
      });
      return record;
    });
    return created;
  }

  static async updateInstitution(id: number, name: string | undefined, version: number, actor: Actor) {
    const existing = await prisma.trainingInstitution.findUnique({ where: { id } });
    if (!existing) throw notFound("المؤسسة التدريبية غير موجودة");

    if (name !== undefined && name !== existing.name) {
      await assertUniqueInstitutionName(name, id);
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const result = await tx.trainingInstitution.updateMany({
        where: { id, version },
        data: {
          ...(name !== undefined && { name }),
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        throw conflict(
          "تعارض في الإصدار (version): السجل عُدِّل بواسطة مستخدم آخر. أعد تحميل البيانات ثم حاول مجدداً"
        );
      }
      const fresh = await tx.trainingInstitution.findUniqueOrThrow({ where: { id } });
      await writeAudit(tx, {
        entityType: "institution",
        entityId: id,
        action: "update",
        changedBy: actor.userId,
        oldValues: institutionAudit(existing),
        newValues: institutionAudit(fresh),
      });
      return fresh;
    });

    return updated;
  }

  static async deleteInstitution(id: number, actor: Actor) {
    const existing = await prisma.trainingInstitution.findUnique({ where: { id } });
    if (!existing) throw notFound("المؤسسة التدريبية غير موجودة");

    const courses = await prisma.trainingCourse.count({
      where: { trainingInstitutionId: id },
    });
    if (courses > 0) {
      throw unprocessable(
        `لا يمكن حذف المؤسسة: يوجد ${courses} دورة تدريبية مرتبطة بها. أزل المراجع أولاً.`,
        { courses }
      );
    }

    try {
      await prisma.$transaction(async (tx: any) => {
        await writeAudit(tx, {
          entityType: "institution",
          entityId: id,
          action: "delete",
          changedBy: actor.userId,
          oldValues: institutionAudit(existing),
        });
        await tx.trainingInstitution.delete({ where: { id } });
      });
    } catch (error: any) {
      if (error?.code === "P2003") {
        throw unprocessable("لا يمكن حذف المؤسسة: يوجد سجل مرتبط بها.");
      }
      throw error;
    }

    return { success: true, id };
  }

  // ---------------------------------------------------------------- scheduled courses
  static async listScheduled(options: { trainingCourseId?: number } = {}) {
    const where: any = {};
    if (options.trainingCourseId) where.trainingCourseId = options.trainingCourseId;
    return prisma.scheduledTrainingCourse.findMany({
      where,
      include: scheduledInclude,
      orderBy: { startDate: "desc" },
    });
  }

  static async getScheduled(id: number) {
    const scheduled = await prisma.scheduledTrainingCourse.findUnique({
      where: { id },
      include: scheduledInclude,
    });
    if (!scheduled) throw notFound("الدورة المجدولة غير موجودة");
    return scheduled;
  }

  static async createScheduled(data: ScheduledCourseInput, actor: Actor) {
    const course = await prisma.trainingCourse.findFirst({
      where: { id: data.trainingCourseId, deletedAt: null },
    });
    if (!course) throw unprocessable("الدورة التدريبية غير موجودة أو محذوفة");

    const created = await prisma.$transaction(async (tx: any) => {
      const record = await tx.scheduledTrainingCourse.create({
        data: {
          trainingCourseId: data.trainingCourseId!,
          site: data.site ?? null,
          numStudents: data.numStudents ?? null,
          notes: data.notes ?? null,
          instructors: data.instructors ?? null,
          startDate: toDate(data.startDate) ?? null,
          endDate: toDate(data.endDate) ?? null,
          countryId: data.countryId ?? null,
          districtId: data.districtId ?? null,
          countyId: data.countyId ?? null,
          status: data.status ?? "scheduled",
        },
      });
      await writeAudit(tx, {
        entityType: "scheduled_course",
        entityId: record.id,
        action: "create",
        changedBy: actor.userId,
        newValues: scheduledAudit(record),
      });
      return record;
    });

    return created;
  }

  static async updateScheduled(
    id: number,
    input: ScheduledCourseInput & { version: number },
    actor: Actor
  ) {
    const existing = await prisma.scheduledTrainingCourse.findUnique({ where: { id } });
    if (!existing) throw notFound("الدورة المجدولة غير موجودة");

    if (input.status !== undefined && input.status !== existing.status) {
      const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw unprocessable(
          `انتقال حالة غير مسموح: ${existing.status} → ${input.status}`,
          { from: existing.status, to: input.status, allowed }
        );
      }
    }

    const { version, ...data } = input;
    const updateData: any = { ...data, version: { increment: 1 } };
    if (data.startDate !== undefined) updateData.startDate = toDate(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = toDate(data.endDate);

    const updated = await prisma.$transaction(async (tx: any) => {
      const result = await tx.scheduledTrainingCourse.updateMany({
        where: { id, version },
        data: updateData,
      });
      if (result.count === 0) {
        throw conflict(
          "تعارض في الإصدار (version): السجل عُدِّل بواسطة مستخدم آخر. أعد تحميل البيانات ثم حاول مجدداً"
        );
      }
      const fresh = await tx.scheduledTrainingCourse.findUniqueOrThrow({ where: { id } });
      await writeAudit(tx, {
        entityType: "scheduled_course",
        entityId: id,
        action: "update",
        changedBy: actor.userId,
        oldValues: scheduledAudit(existing),
        newValues: scheduledAudit(fresh),
      });
      return fresh;
    });

    return updated;
  }

  static async deleteScheduled(id: number, actor: Actor) {
    const existing = await prisma.scheduledTrainingCourse.findUnique({ where: { id } });
    if (!existing) throw notFound("الدورة المجدولة غير موجودة");

    const enrollments = await prisma.personScheduledTraining.count({
      where: { scheduledTrainingCourseId: id },
    });
    if (enrollments > 0) {
      throw unprocessable(
        `لا يمكن حذف الدورة المجدولة: يوجد ${enrollments} متدرب مسجّل. أزل التسجيلات أولاً.`,
        { enrollments }
      );
    }

    await prisma.$transaction(async (tx: any) => {
      await writeAudit(tx, {
        entityType: "scheduled_course",
        entityId: id,
        action: "delete",
        changedBy: actor.userId,
        oldValues: scheduledAudit(existing),
      });
      await tx.scheduledTrainingCourse.delete({ where: { id } });
    });

    return { success: true, id };
  }

  // ---------------------------------------------------------------- enrollments
  static async listEnrollments(scheduledId: number) {
    const scheduled = await prisma.scheduledTrainingCourse.findUnique({
      where: { id: scheduledId },
    });
    if (!scheduled) throw notFound("الدورة المجدولة غير موجودة");

    return prisma.personScheduledTraining.findMany({
      where: { scheduledTrainingCourseId: scheduledId },
      include: { person: true, scheduledTrainingCourse: true },
      orderBy: { createdAt: "asc" },
    });
  }

  static async enroll(scheduledId: number, data: EnrollmentInput, actor: Actor) {
    const scheduled = await prisma.scheduledTrainingCourse.findUnique({
      where: { id: scheduledId },
    });
    if (!scheduled) throw notFound("الدورة المجدولة غير موجودة");

    if (scheduled.status === "completed") {
      throw unprocessable("لا يمكن التسجيل في دورة مكتملة");
    }
    if (scheduled.status === "cancelled") {
      throw unprocessable("لا يمكن التسجيل في دورة ملغاة");
    }

    const person = await prisma.person.findUnique({ where: { id: data.personId! } });
    if (!person) throw unprocessable("الشخص غير موجود");

    const duplicate = await prisma.personScheduledTraining.findFirst({
      where: {
        scheduledTrainingCourseId: scheduledId,
        personId: data.personId,
      },
    });
    if (duplicate) throw conflict("الشخص مسجّل بالفعل في هذه الدورة");

    const created = await prisma.$transaction(async (tx: any) => {
      const record = await tx.personScheduledTraining.create({
        data: {
          personId: data.personId!,
          scheduledTrainingCourseId: scheduledId,
          isRetraining: data.isRetraining ?? false,
          completed: false,
          requestDate: new Date(),
          notes: data.notes ?? null,
          trainingCourseEvaluationId: data.trainingCourseEvaluationId ?? null,
          trainingCourseRequestorId: data.trainingCourseRequestorId ?? null,
          trainingCourseId: scheduled.trainingCourseId,
        },
      });
      await writeAudit(tx, {
        entityType: "enrollment",
        entityId: record.id,
        action: "create",
        changedBy: actor.userId,
        newValues: enrollmentAudit(record),
      });
      return record;
    });

    return created;
  }

  static async updateEnrollment(id: number, data: EnrollmentInput, actor: Actor) {
    const existing = await prisma.personScheduledTraining.findUnique({ where: { id } });
    if (!existing) throw notFound("التسجيل غير موجود");

    const updated = await prisma.$transaction(async (tx: any) => {
      const record = await tx.personScheduledTraining.update({
        where: { id },
        data: {
          ...(data.completed !== undefined && { completed: data.completed }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.trainingCourseEvaluationId !== undefined && {
            trainingCourseEvaluationId: data.trainingCourseEvaluationId,
          }),
          ...(data.trainingCourseRequestorId !== undefined && {
            trainingCourseRequestorId: data.trainingCourseRequestorId,
          }),
        },
      });
      await writeAudit(tx, {
        entityType: "enrollment",
        entityId: id,
        action: "update",
        changedBy: actor.userId,
        oldValues: enrollmentAudit(existing),
        newValues: enrollmentAudit(record),
      });
      return record;
    });

    return updated;
  }

  static async deleteEnrollment(id: number, actor: Actor) {
    const existing = await prisma.personScheduledTraining.findUnique({ where: { id } });
    if (!existing) throw notFound("التسجيل غير موجود");

    await prisma.$transaction(async (tx: any) => {
      await writeAudit(tx, {
        entityType: "enrollment",
        entityId: id,
        action: "delete",
        changedBy: actor.userId,
        oldValues: enrollmentAudit(existing),
      });
      await tx.personScheduledTraining.delete({ where: { id } });
    });

    return { success: true, id };
  }

  // ---------------------------------------------------------------- lookups
  static async listStatuses() {
    return prisma.trainingCourseStatus.findMany({ orderBy: { name: "asc" } });
  }

  static async listCategories() {
    return prisma.trainingCourseCategory.findMany({ orderBy: { name: "asc" } });
  }
}
