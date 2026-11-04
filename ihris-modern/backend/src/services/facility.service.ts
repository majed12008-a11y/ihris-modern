import { prisma } from "../lib/prisma";

export interface FacilityCreateInput {
  name: string;
  facilityTypeId?: number | null;
  districtId?: number | null;
  countyId?: number | null;
  countryId?: number | null;
  regionId?: number | null;
}

export class FacilityService {
  static async list() {
    return prisma.facility.findMany({
      include: { facilityType: true },
      orderBy: { name: "asc" },
    });
  }

  static async getById(id: number) {
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: { facilityType: true, positions: true },
    });
    if (!facility) throw new Error("Facility not found");
    return facility;
  }

  static async create(data: FacilityCreateInput) {
    return prisma.facility.create({
      data: {
        name: data.name,
        facilityTypeId: data.facilityTypeId ?? null,
        districtId: data.districtId ?? null,
        countyId: data.countyId ?? null,
        countryId: data.countryId ?? null,
        regionId: data.regionId ?? null,
      },
    });
  }

  static async update(id: number, data: Partial<FacilityCreateInput>) {
    const existing = await prisma.facility.findUnique({ where: { id } });
    if (!existing) throw new Error("Facility not found");

    return prisma.facility.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.facilityTypeId !== undefined && { facilityTypeId: data.facilityTypeId }),
        ...(data.districtId !== undefined && { districtId: data.districtId }),
        ...(data.countyId !== undefined && { countyId: data.countyId }),
        ...(data.countryId !== undefined && { countryId: data.countryId }),
        ...(data.regionId !== undefined && { regionId: data.regionId }),
      },
    });
  }

  static async delete(id: number) {
    const existing = await prisma.facility.findUnique({ where: { id } });
    if (!existing) throw new Error("Facility not found");
    return prisma.facility.delete({ where: { id } });
  }
}
