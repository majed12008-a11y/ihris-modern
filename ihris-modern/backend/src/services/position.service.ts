import { prisma } from "../lib/prisma";

export interface PositionCreateInput {
  code?: string | null;
  jobId?: number | null;
  title?: string | null;
  description?: string | null;
  proposedSalary?: string | null;
  source?: string | null;
  // ADR-009 §9.2 (8): FK إلى salary_sources
  sourceId?: number | null;
  supervisorId?: number | null;
  facilityId?: number | null;
  departmentId?: number | null;
  posTypeId?: number | null;
  proposedEndDate?: Date | null;
  proposedHiringDate?: Date | null;
  statusId?: number | null;
  postedDate?: Date | null;
  comments?: string | null;
  interviewComments?: string | null;
}

export interface PositionFilter {
  search?: string;
  facilityId?: number;
  jobId?: number;
  page?: number;
  limit?: number;
}

export class PositionService {
  static async list(filter: PositionFilter = {}) {
    const { search, facilityId, jobId, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (facilityId) where.facilityId = facilityId;
    if (jobId) where.jobId = jobId;

    const [data, total] = await prisma.$transaction([
      prisma.position.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: "asc" },
        include: {
          job: true,
          facility: true,
          department: true,
          posType: true,
        },
      }),
      prisma.position.count({ where }),
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
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        job: true,
        facility: true,
        department: true,
        posType: true,
        personPositions: {
          include: { person: true },
        },
        decisions: true,
        interviews: true,
      },
    });

    if (!position) {
      throw new Error("Position not found");
    }

    return position;
  }

  static async create(data: PositionCreateInput) {
    return prisma.position.create({
      data: {
        code: data.code ?? null,
        jobId: data.jobId ?? null,
        title: data.title ?? null,
        description: data.description ?? null,
        proposedSalary: data.proposedSalary ?? null,
        source: data.source ?? null,
        sourceId: data.sourceId ?? null,
        supervisorId: data.supervisorId ?? null,
        facilityId: data.facilityId ?? null,
        departmentId: data.departmentId ?? null,
        posTypeId: data.posTypeId ?? null,
        proposedEndDate: data.proposedEndDate ?? null,
        proposedHiringDate: data.proposedHiringDate ?? null,
        statusId: data.statusId ?? null,
        postedDate: data.postedDate ?? null,
        comments: data.comments ?? null,
        interviewComments: data.interviewComments ?? null,
      },
    });
  }

  static async update(id: number, data: Partial<PositionCreateInput>) {
    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Position not found");
    }

    return prisma.position.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.jobId !== undefined && { jobId: data.jobId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.proposedSalary !== undefined && { proposedSalary: data.proposedSalary }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.sourceId !== undefined && { sourceId: data.sourceId }),
        ...(data.supervisorId !== undefined && { supervisorId: data.supervisorId }),
        ...(data.facilityId !== undefined && { facilityId: data.facilityId }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.posTypeId !== undefined && { posTypeId: data.posTypeId }),
        ...(data.proposedEndDate !== undefined && { proposedEndDate: data.proposedEndDate }),
        ...(data.proposedHiringDate !== undefined && { proposedHiringDate: data.proposedHiringDate }),
        ...(data.statusId !== undefined && { statusId: data.statusId }),
        ...(data.postedDate !== undefined && { postedDate: data.postedDate }),
        ...(data.comments !== undefined && { comments: data.comments }),
        ...(data.interviewComments !== undefined && { interviewComments: data.interviewComments }),
      },
    });
  }

  static async delete(id: number) {
    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Position not found");
    }

    return prisma.position.delete({ where: { id } });
  }
}
