import { prisma } from "../lib/prisma";

export interface ReportDefinitionCreateInput {
  name: string;
  description?: string | null;
  type: string;
  definition: any;
  isEnabled?: boolean;
  createdBy: number;
}

export interface ReportDefinitionUpdateInput {
  name?: string;
  description?: string | null;
  type?: string;
  definition?: any;
  isEnabled?: boolean;
}

export interface ReportExecutionCreateInput {
  reportDefinitionId: number;
  executedBy: number;
  status?: string;
  result?: any;
  errorMessage?: string | null;
  startedAt?: Date;
  completedAt?: Date | null;
  rowCount?: number;
  executionTimeMs?: number | null;
}

export interface ReportFilter {
  search?: string;
  isEnabled?: boolean;
  createdBy?: number;
  page?: number;
  limit?: number;
}

export class ReportService {
  /**
   * قائمة تعريفات التقارير مع التصفح والبحث
   */
  static async list(filter: ReportFilter = {}) {
    const { search, isEnabled, createdBy, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    const [data, total] = await prisma.$transaction([
      prisma.reportDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          createdByUser: {
            select: { id: true, username: true, firstname: true, lastname: true },
          },
          _count: {
            select: { executions: true },
          },
        },
      }),
      prisma.reportDefinition.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * جلب تعريف تقرير بواسطة المعرف
   */
  static async getById(id: number) {
    const report = await prisma.reportDefinition.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { id: true, username: true, firstname: true, lastname: true },
        },
        executions: {
          orderBy: { startedAt: "desc" },
          take: 10,
          include: {
            executedByUser: {
              select: { id: true, username: true, firstname: true, lastname: true },
            },
          },
        },
        preferences: {
          include: {
            user: {
              select: { id: true, username: true, firstname: true, lastname: true },
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report definition not found");
    }

    return report;
  }

  /**
   * إنشاء تعريف تقرير جديد
   */
  static async create(data: ReportDefinitionCreateInput) {
    const report = await prisma.reportDefinition.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        definition: data.definition,
        isEnabled: data.isEnabled ?? true,
        createdBy: data.createdBy,
      },
      include: {
        createdByUser: {
          select: { id: true, username: true, firstname: true, lastname: true },
        },
      },
    });

    return report;
  }

  /**
   * تعديل تعريف تقرير
   */
  static async update(id: number, data: ReportDefinitionUpdateInput) {
    const existing = await prisma.reportDefinition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error("Report definition not found");
    }

    return prisma.reportDefinition.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.definition !== undefined && { definition: data.definition }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
      include: {
        createdByUser: {
          select: { id: true, username: true, firstname: true, lastname: true },
        },
      },
    });
  }

  /**
   * حذف تعريف تقرير
   */
  static async delete(id: number) {
    const existing = await prisma.reportDefinition.findUnique({
      where: { id },
      include: {
        executions: {
          take: 1,
        },
      },
    });
    if (!existing) {
      throw new Error("Report definition not found");
    }

    // منع الحذف إذا كانت هناك عمليات تنفيذ مرتبطة (اختياري - يمكن تغيير هذا لاحقًا)
    if (existing.executions && existing.executions.length > 0) {
      throw new Error("Cannot delete report definition with existing executions");
    }

    return prisma.reportDefinition.delete({
      where: { id },
    });
  }

  /**
   * تنفيذ تقرير
   */
  static async execute(executionData: ReportExecutionCreateInput) {
    const reportDefinition = await prisma.reportDefinition.findUnique({
      where: { id: executionData.reportDefinitionId },
    });

    if (!reportDefinition) {
      throw new Error("Report definition not found");
    }

    if (!reportDefinition.isEnabled) {
      throw new Error("Report definition is disabled");
    }

    // إنشاء سجل التنفيذ
    const execution = await prisma.reportExecution.create({
      data: {
        reportDefinitionId: executionData.reportDefinitionId,
        executedBy: executionData.executedBy,
        status: "running",
        startedAt: executionData.startedAt ?? new Date(),
      },
    });

    try {
      // هنا يتم تنفيذ الاستعلام فعليًا
      // في هذه النسخة الأولية، نقوم بإرجاع نتيجة وهمية
      // في الإصدار الكامل، سيتم تنفيذ الاستعلام بناءً على reportDefinition.definition
      const result = {
        reportId: reportDefinition.id,
        reportName: reportDefinition.name,
        executionId: execution.id,
        executedAt: new Date(),
        rowCount: 0,
        data: [],
        message: "Report execution engine not yet implemented - placeholder",
      };

      // تحديث سجل التنفيذ بالنتيجة
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          result,
          rowCount: 0,
          executionTimeMs: 0,
        },
      });

      return {
        executionId: execution.id,
        status: "completed",
        result,
      };
    } catch (error: any) {
      // تحديث سجل التنفيذ بالخطأ
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * جلب سجل تنفيذ تقرير بواسطة المعرف
   */
  static async getExecutionById(id: number) {
    const execution = await prisma.reportExecution.findUnique({
      where: { id },
      include: {
        reportDefinition: {
          select: { id: true, name: true, type: true },
        },
        executedByUser: {
          select: { id: true, username: true, firstname: true, lastname: true },
        },
      },
    });

    if (!execution) {
      throw new Error("Report execution not found");
    }

    return execution;
  }

  /**
   * قائمة سجلات تنفيذ تقرير معين
   */
  static async listExecutions(reportDefinitionId: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.reportExecution.findMany({
        where: { reportDefinitionId },
        skip,
        take: limit,
        orderBy: { startedAt: "desc" },
        include: {
          executedByUser: {
            select: { id: true, username: true, firstname: true, lastname: true },
          },
        },
      }),
      prisma.reportExecution.count({ where: { reportDefinitionId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * إلغاء تنشيط تقرير (soft delete)
   */
  static async disable(id: number) {
    return this.update(id, { isEnabled: false });
  }

  /**
   * إعادة تنشيط تقرير
   */
  static async enable(id: number) {
    return this.update(id, { isEnabled: true });
  }
}
