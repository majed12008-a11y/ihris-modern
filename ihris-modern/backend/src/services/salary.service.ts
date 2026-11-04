import { prisma } from "../lib/prisma";

export interface SalaryCreateInput {
  personId: number;
  startDate: Date;
  endDate?: Date | null;
  salary: string;
  notes?: string | null;
}

export interface SalaryFilter {
  personId?: number;
  page?: number;
  limit?: number;
}

export class SalaryService {
  static async list(filter: SalaryFilter = {}) {
    const { personId, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (personId) where.personId = personId;

    const [data, total] = await prisma.$transaction([
      prisma.salary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          person: {
            select: { id: true, surname: true, firstname: true },
          },
        },
      }),
      prisma.salary.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: number) {
    const salary = await prisma.salary.findUnique({
      where: { id },
      include: { person: true },
    });
    if (!salary) throw new Error("Salary record not found");
    return salary;
  }

  static async create(data: SalaryCreateInput) {
    return prisma.salary.create({
      data: {
        personId: data.personId,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        salary: data.salary,
        notes: data.notes ?? null,
      },
      include: { person: true },
    });
  }

  static async update(id: number, data: Partial<SalaryCreateInput>) {
    const existing = await prisma.salary.findUnique({ where: { id } });
    if (!existing) throw new Error("Salary record not found");

    return prisma.salary.update({
      where: { id },
      data: {
        ...(data.personId !== undefined && { personId: data.personId }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.salary !== undefined && { salary: data.salary }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { person: true },
    });
  }

  static async delete(id: number) {
    const existing = await prisma.salary.findUnique({ where: { id } });
    if (!existing) throw new Error("Salary record not found");
    return prisma.salary.delete({ where: { id } });
  }
}
