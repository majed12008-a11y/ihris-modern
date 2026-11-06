import { prisma } from "../lib/prisma";
import { badRequest, conflict, notFound, unprocessable } from "../lib/httpError";

export interface FacilityCreateInput {
  name: string;
  facilityTypeId?: number | null;
  countryId: number;
  districtId: number;
  countyId: number;
  regionId: number;
}

export interface FacilityUpdateInput {
  version: number;
  name?: string;
  facilityTypeId?: number | null;
  countryId?: number;
  districtId?: number;
  countyId?: number;
  regionId?: number;
}

export interface FacilityFilter {
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
  facilityType: true,
  country: true,
  district: true,
  county: true,
  region: true,
  _count: { select: { positions: true } },
} as const;

const DETAIL_INCLUDE = {
  facilityType: true,
  country: true,
  district: true,
  county: true,
  region: true,
  positions: {
    orderBy: { id: "asc" as const },
    include: {
      job: true,
      department: true,
      posType: true,
      status: true,
    },
  },
} as const;

function toPublic(facility: any) {
  return {
    id: facility.id,
    name: facility.name,
    facilityTypeId: facility.facilityTypeId ?? null,
    countryId: facility.countryId ?? null,
    districtId: facility.districtId ?? null,
    countyId: facility.countyId ?? null,
    regionId: facility.regionId ?? null,
    version: facility.version,
    createdAt: facility.createdAt,
    updatedAt: facility.updatedAt,
    facilityType: facility.facilityType
      ? { id: facility.facilityType.id, name: facility.facilityType.name }
      : null,
    country: facility.country
      ? { id: facility.country.id, name: facility.country.name }
      : null,
    district: facility.district
      ? { id: facility.district.id, name: facility.district.name }
      : null,
    county: facility.county
      ? { id: facility.county.id, name: facility.county.name }
      : null,
    region: facility.region
      ? { id: facility.region.id, name: facility.region.name }
      : null,
    positionsCount:
      facility._count?.positions ??
      (Array.isArray(facility.positions) ? facility.positions.length : 0),
  };
}

function auditValues(facility: any) {
  return {
    name: facility.name,
    facilityTypeId: facility.facilityTypeId ?? null,
    countryId: facility.countryId ?? null,
    districtId: facility.districtId ?? null,
    countyId: facility.countyId ?? null,
    regionId: facility.regionId ?? null,
    version: facility.version,
  };
}

async function writeAudit(
  tx: any,
  entry: {
    facilityId: number;
    action: "create" | "update" | "delete";
    changedBy: number;
    oldValues?: unknown;
    newValues?: unknown;
    reason?: string | null;
  }
): Promise<void> {
  const data: any = {
    facilityId: entry.facilityId,
    action: entry.action,
    changedBy: entry.changedBy,
  };
  if (entry.oldValues !== undefined) data.oldValues = entry.oldValues;
  if (entry.newValues !== undefined) data.newValues = entry.newValues;
  if (entry.reason) data.reason = entry.reason;

  await tx.facilityAuditLog.create({ data });
}

/**
 * BR-097 + اتساق التسلسل الجغرافي:
 * country → district.countryId → county.districtId، وregion مستقل.
 */
async function assertLocation(loc: {
  countryId: number | null;
  districtId: number | null;
  countyId: number | null;
  regionId: number | null;
}): Promise<void> {
  if (!loc.countryId) throw badRequest("الدولة مطلوبة (BR-097)");
  if (!loc.districtId) throw badRequest("المحافظة مطلوبة (BR-097)");
  if (!loc.countyId) throw badRequest("المديرية مطلوبة (BR-097)");
  if (!loc.regionId) throw badRequest("المنطقة مطلوبة (BR-097)");

  const [country, district, county, region] = await Promise.all([
    prisma.country.findUnique({ where: { id: loc.countryId } }),
    prisma.district.findUnique({ where: { id: loc.districtId } }),
    prisma.county.findUnique({ where: { id: loc.countyId } }),
    prisma.region.findUnique({ where: { id: loc.regionId } }),
  ]);

  if (!country) throw badRequest("الدولة المحددة غير موجودة");
  if (!district) throw badRequest("المحافظة المحددة غير موجودة");
  if (district.countryId !== loc.countryId) {
    throw badRequest("المحافظة المحددة لا تنتمي إلى الدولة المحددة");
  }
  if (!county) throw badRequest("المديرية المحددة غير موجودة");
  if (county.districtId !== loc.districtId) {
    throw badRequest("المديرية المحددة لا تنتمي إلى المحافظة المحددة");
  }
  if (!region) throw badRequest("المنطقة المحددة غير موجودة");
}

async function assertFacilityType(facilityTypeId: number | null | undefined) {
  if (facilityTypeId === undefined || facilityTypeId === null) return;
  const type = await prisma.facilityType.findUnique({ where: { id: facilityTypeId } });
  if (!type) throw badRequest("نوع المنشأة المحدد غير موجود");
}

async function assertUniqueName(name: string, excludeId?: number) {
  const duplicate = await prisma.facility.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });
  if (duplicate) throw conflict("توجد منشأة أخرى بنفس الاسم");
}

export class FacilityService {
  static async list(filter: FacilityFilter = {}) {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit =
      filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) {
      where.name = { contains: filter.search, mode: "insensitive" };
    }

    const [data, total] = await prisma.$transaction([
      prisma.facility.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: LIST_INCLUDE,
      }),
      prisma.facility.count({ where }),
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
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!facility) throw notFound("المنشأة غير موجودة");

    return {
      ...toPublic(facility),
      positions: facility.positions.map((p: any) => ({
        id: p.id,
        code: p.code,
        title: p.title,
        job: p.job ? { id: p.job.id, title: p.job.title } : null,
        department: p.department
          ? { id: p.department.id, name: p.department.name }
          : null,
        posType: p.posType ? { id: p.posType.id, name: p.posType.name } : null,
        status: p.status ? { id: p.status.id, name: p.status.name } : null,
        postedDate: p.postedDate,
      })),
    };
  }

  static async create(input: FacilityCreateInput, actor: Actor) {
    await assertLocation(input);
    await assertFacilityType(input.facilityTypeId);
    await assertUniqueName(input.name);

    const created = await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.create({
        data: {
          name: input.name,
          facilityTypeId: input.facilityTypeId ?? null,
          countryId: input.countryId,
          districtId: input.districtId,
          countyId: input.countyId,
          regionId: input.regionId,
        },
        include: LIST_INCLUDE,
      });

      await writeAudit(tx, {
        facilityId: facility.id,
        action: "create",
        changedBy: actor.userId,
        newValues: auditValues(facility),
      });

      return facility;
    });

    return toPublic(created);
  }

  static async update(id: number, input: FacilityUpdateInput, actor: Actor) {
    const existing = await prisma.facility.findUnique({ where: { id } });
    if (!existing) throw notFound("المنشأة غير موجودة");

    const merged = {
      name: input.name !== undefined ? input.name : existing.name,
      facilityTypeId:
        input.facilityTypeId !== undefined
          ? input.facilityTypeId
          : existing.facilityTypeId,
      countryId: input.countryId !== undefined ? input.countryId : existing.countryId,
      districtId:
        input.districtId !== undefined ? input.districtId : existing.districtId,
      countyId: input.countyId !== undefined ? input.countyId : existing.countyId,
      regionId: input.regionId !== undefined ? input.regionId : existing.regionId,
    };

    const locationTouched =
      input.countryId !== undefined ||
      input.districtId !== undefined ||
      input.countyId !== undefined ||
      input.regionId !== undefined;

    if (locationTouched) {
      await assertLocation(merged);
    }
    if (input.facilityTypeId !== undefined) {
      await assertFacilityType(input.facilityTypeId);
    }
    if (input.name !== undefined && input.name !== existing.name) {
      await assertUniqueName(input.name, id);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const data: any = {
        version: { increment: 1 },
      };
      if (input.name !== undefined) data.name = input.name;
      if (input.facilityTypeId !== undefined)
        data.facilityTypeId = input.facilityTypeId;
      if (input.countryId !== undefined) data.countryId = input.countryId;
      if (input.districtId !== undefined) data.districtId = input.districtId;
      if (input.countyId !== undefined) data.countyId = input.countyId;
      if (input.regionId !== undefined) data.regionId = input.regionId;

      const result = await tx.facility.updateMany({
        where: { id, version: input.version },
        data,
      });

      if (result.count === 0) {
        throw conflict(
          "تعارض في النسخة (version): عُدِّلت المنشأة من جلسة أخرى. أعد تحميل البيانات وحاول مجدداً"
        );
      }

      const fresh = await tx.facility.findUniqueOrThrow({
        where: { id },
        include: LIST_INCLUDE,
      });

      await writeAudit(tx, {
        facilityId: id,
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
    const existing = await prisma.facility.findUnique({ where: { id } });
    if (!existing) throw notFound("المنشأة غير موجودة");

    const positionsCount = await prisma.position.count({ where: { facilityId: id } });
    if (positionsCount > 0) {
      throw unprocessable(
        `لا يمكن حذف المنشأة: لديها ${positionsCount} وظيفة مرتبطة. ` +
          "انقل الوظائف إلى منشأة أخرى أو احذفها أولاً.",
        { positionsCount }
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        await writeAudit(tx, {
          facilityId: id,
          action: "delete",
          changedBy: actor.userId,
          oldValues: auditValues(existing),
        });
        await tx.facility.delete({ where: { id } });
      });
    } catch (error: any) {
      // شبكة أمان للسباق: قيد FK من positions
      if (error?.code === "P2003") {
        throw unprocessable(
          "لا يمكن حذف المنشأة: توجد سجلات مرتبطة بها. احذف الوظائف المرتبطة أولاً."
        );
      }
      throw error;
    }

    return { success: true, id };
  }

  // ------------------------------------------------------------
  // بيانات مرجعية للتسلسل الجغرافي (ADR-006)
  // ------------------------------------------------------------

  static async countries() {
    return prisma.country.findMany({ orderBy: { name: "asc" } });
  }

  static async districts(countryId?: number) {
    if (!countryId) throw badRequest("countryId مطلوب لجلب المحافظات");
    return prisma.district.findMany({
      where: { countryId },
      orderBy: { name: "asc" },
    });
  }

  static async counties(districtId?: number) {
    if (!districtId) throw badRequest("districtId مطلوب لجلب المديريات");
    return prisma.county.findMany({
      where: { districtId },
      orderBy: { name: "asc" },
    });
  }

  static async regions() {
    return prisma.region.findMany({ orderBy: { name: "asc" } });
  }

  static async facilityTypes() {
    return prisma.facilityType.findMany({ orderBy: { name: "asc" } });
  }
}
