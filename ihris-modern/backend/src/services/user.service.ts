import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  unprocessable,
} from "../lib/httpError";

export interface UserCreateInput {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

export interface UserUpdateInput {
  version: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
}

export interface UserFilter {
  page?: number;
  limit?: number;
  search?: string;
}

export interface Actor {
  userId: number;
  username: string;
  role: string;
}

const RESTORE_WINDOW_DAYS = 30;

function isAdmin(actor: Actor): boolean {
  return actor.role === "admin";
}

function toPublic(user: any) {
  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.access?.[0]?.role?.name || "hr_staff",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    version: user.version,
    deletedAt: user.deletedAt ?? null,
    deletedBy: user.deletedBy ?? null,
    deletionReason: user.deletionReason ?? null,
    restoredAt: user.restoredAt ?? null,
  };
}

function auditValues(user: any) {
  return {
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.access?.[0]?.role?.name || null,
  };
}

async function writeAudit(
  tx: any,
  entry: {
    userId: number;
    action: "create" | "update" | "delete" | "restore";
    changedBy: number;
    oldValues?: unknown;
    newValues?: unknown;
    reason?: string | null;
  }
): Promise<void> {
  const data: any = {
    userId: entry.userId,
    action: entry.action,
    changedBy: entry.changedBy,
  };
  if (entry.oldValues !== undefined) data.oldValues = entry.oldValues;
  if (entry.newValues !== undefined) data.newValues = entry.newValues;
  if (entry.reason) data.reason = entry.reason;

  await tx.userAuditLog.create({ data });
}

export class UserService {
  static async list(filter: UserFilter = {}) {
    const { page = 1, limit = 50, search } = filter;
    const skip = (page - 1) * limit;

    // ADR-003: القائمة الافتراضية تستثني المحذوفين منطقياً
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { firstname: { contains: search } },
        { lastname: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { username: "asc" },
        include: {
          access: { include: { role: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: data.map(toPublic),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** قائمة المحذوفين — admin فقط (يتحقق في المتحكم/الخدمة) */
  static async listDeleted(actor: Actor, filter: UserFilter = {}) {
    if (!isAdmin(actor)) throw forbidden();

    const { page = 1, limit = 50, search } = filter;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: { not: null } };
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { firstname: { contains: search } },
        { lastname: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deletedAt: "desc" },
        include: { access: { include: { role: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    const now = Date.now();
    return {
      data: data.map((user) => {
        const elapsedDays = user.deletedAt
          ? Math.floor((now - user.deletedAt.getTime()) / (24 * 60 * 60 * 1000))
          : 0;
        return {
          ...toPublic(user),
          daysSinceDeletion: elapsedDays,
          daysRemaining: Math.max(0, RESTORE_WINDOW_DAYS - elapsedDays),
          restorable:
            !!user.deletedAt &&
            now - user.deletedAt.getTime() <= RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** مستخدم واحد — self أو admin */
  static async getById(id: number, actor: Actor) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { access: { include: { role: true } } },
    });

    if (!user) throw notFound();
    if (!isAdmin(actor) && actor.userId !== id) {
      throw forbidden("يمكنك عرض بيانات حسابك فقط");
    }
    if (user.deletedAt && !isAdmin(actor)) {
      throw notFound();
    }

    return toPublic(user);
  }

  static async create(data: UserCreateInput, actor: Actor) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) throw badRequest("اسم المستخدم مستخدم بالفعل");

    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) throw badRequest("البريد الإلكتروني مستخدم بالفعل");

    const role = await prisma.role.findUnique({ where: { name: data.role } });
    if (!role) throw badRequest("الدور غير موجود");

    const hashedPassword = await hashPassword(data.password);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          creatorId: actor.userId,
          access: {
            create: { roleId: role.id },
          },
        },
        include: { access: { include: { role: true } } },
      });

      await writeAudit(tx, {
        userId: user.id,
        action: "create",
        changedBy: actor.userId,
        newValues: auditValues(user),
      });

      return user;
    });

    return toPublic(created);
  }

  /**
   * تعديل مستخدم — self (بياناته) أو admin (أي مستخدم).
   * Optimistic Lock: يلزم version مطابق، وإلا 409.
   */
  static async update(id: number, input: UserUpdateInput, actor: Actor) {
    const target = await prisma.user.findUnique({
      where: { id },
      include: { access: { include: { role: true } } },
    });

    if (!target) throw notFound();

    const actorIsAdmin = isAdmin(actor);
    if (!actorIsAdmin && actor.userId !== id) {
      throw forbidden("يمكنك تعديل بيانات حسابك فقط");
    }
    if (target.deletedAt) {
      throw conflict("المستخدم محذوف — يجب استعادته قبل التعديل");
    }

    const currentRole = target.access?.[0]?.role?.name || "hr_staff";

    // منع تصعيد الصلاحيات: غير الأدمن لا يغيّر الدور
    if (!actorIsAdmin && input.role !== undefined && input.role !== currentRole) {
      throw forbidden("لا يمكنك تغيير دور حسابك");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const data: any = {};
      if (input.firstname !== undefined) data.firstname = input.firstname;
      if (input.lastname !== undefined) data.lastname = input.lastname;
      if (input.email !== undefined) data.email = input.email;

      if (input.email !== undefined) {
        const duplicate = await tx.user.findFirst({
          where: { email: input.email, id: { not: id } },
        });
        if (duplicate) throw badRequest("البريد الإلكتروني مستخدم بالفعل");
      }

      let roleId: number | undefined;
      if (input.role !== undefined) {
        const role = await tx.role.findUnique({ where: { name: input.role } });
        if (!role) throw badRequest("الدور غير موجود");
        roleId = role.id;
      }

      const result = await tx.user.updateMany({
        where: { id, version: input.version, deletedAt: null },
        data: { ...data, version: { increment: 1 } },
      });

      if (result.count === 0) {
        throw conflict(
          "تعارض في النسخة (version): عُدِّل المستخدم من جلسة أخرى. أعد تحميل البيانات وحاول مجدداً"
        );
      }

      if (roleId !== undefined) {
        await tx.userAccess.deleteMany({ where: { userId: id } });
        await tx.userAccess.create({ data: { userId: id, roleId } });
      }

      const fresh = await tx.user.findUnique({
        where: { id },
        include: { access: { include: { role: true } } },
      });

      await writeAudit(tx, {
        userId: id,
        action: "update",
        changedBy: actor.userId,
        oldValues: auditValues(target),
        newValues: auditValues(fresh),
      });

      return fresh;
    });

    return toPublic(updated);
  }

  /** عدّ سجلات العمل المرتبطة (الخيار A) */
  static async relatedRecordCounts(userId: number) {
    const [definitions, executions] = await Promise.all([
      prisma.reportDefinition.count({ where: { createdBy: userId } }),
      prisma.reportExecution.count({ where: { executedBy: userId } }),
    ]);
    return { definitions, executions, total: definitions + executions };
  }

  /** حذف منطقي — admin فقط، وليس نفسه */
  static async softDelete(
    id: number,
    actor: Actor,
    reason: string,
    version: number
  ) {
    if (!isAdmin(actor)) throw forbidden("الحذف متاح لمسؤول النظام فقط");
    if (actor.userId === id) throw forbidden("لا يمكنك حذف حسابك الشخصي");

    const target = await prisma.user.findUnique({
      where: { id },
      include: { access: { include: { role: true } } },
    });
    if (!target) throw notFound();
    if (target.deletedAt) throw conflict("المستخدم محذوف بالفعل");

    const related = await this.relatedRecordCounts(id);
    if (related.total > 0) {
      throw unprocessable(
        `لا يمكن حذف المستخدم: لديه ${related.total} سجل مرتبط ` +
          `(تعريفات تقارير: ${related.definitions}، تنفيذات تقارير: ${related.executions}). ` +
          "عطّل الحساب بدلاً من حذفه للحفاظ على سجلات العمل.",
        { relatedRecords: related }
      );
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy: actor.userId,
          deletionReason: reason,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw conflict(
          "تعارض في النسخة (version): عُدِّل المستخدم من جلسة أخرى. أعد تحميل البيانات وحاول مجدداً"
        );
      }

      const fresh = await tx.user.findUnique({
        where: { id },
        include: { access: { include: { role: true } } },
      });

      await writeAudit(tx, {
        userId: id,
        action: "delete",
        changedBy: actor.userId,
        oldValues: auditValues(target),
        newValues: {
          deletedAt: fresh?.deletedAt ?? null,
          deletedBy: fresh?.deletedBy ?? null,
          deletionReason: fresh?.deletionReason ?? null,
        },
        reason,
      });

      return fresh;
    });

    return toPublic(deleted);
  }

  /** استعادة — admin فقط، خلال 30 يوماً */
  static async restore(id: number, actor: Actor, version: number) {
    if (!isAdmin(actor)) throw forbidden("الاستعادة متاحة لمسؤول النظام فقط");

    const target = await prisma.user.findUnique({
      where: { id },
      include: { access: { include: { role: true } } },
    });
    if (!target) throw notFound();
    if (!target.deletedAt) throw unprocessable("المستخدم غير محذوف");

    const elapsedMs = Date.now() - target.deletedAt.getTime();
    const windowMs = RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (elapsedMs > windowMs) {
      throw unprocessable(
        `انتهت فترة الاستعادة (${RESTORE_WINDOW_DAYS} يوماً) — لا يمكن استعادة هذا المستخدم`
      );
    }

    const restored = await prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id, version, deletedAt: { not: null } },
        data: {
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
          restoredAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw conflict(
          "تعارض في النسخة (version): عُدِّل المستخدم من جلسة أخرى. أعد تحميل البيانات وحاول مجدداً"
        );
      }

      const fresh = await tx.user.findUnique({
        where: { id },
        include: { access: { include: { role: true } } },
      });

      await writeAudit(tx, {
        userId: id,
        action: "restore",
        changedBy: actor.userId,
        oldValues: {
          deletedAt: target.deletedAt,
          deletedBy: target.deletedBy,
          deletionReason: target.deletionReason,
        },
        newValues: {
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
          restoredAt: fresh?.restoredAt ?? null,
        },
        reason: target.deletionReason,
      });

      return fresh;
    });

    return toPublic(restored);
  }

  /** @deprecated استخدم update() — يبقى للتوافق مع المسار القديم */
  static async updateRole(
    userId: number,
    roleName: string,
    actor: Actor,
    version: number
  ) {
    return this.update(userId, { role: roleName, version }, actor);
  }
}
